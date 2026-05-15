import { NextResponse } from "next/server";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function cleanValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function sendFounderCardNotification(userId: string) {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, full_name, slug, private_token, card_notification_sent_at")
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error || !profile || profile.card_notification_sent_at) return;

  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://signal-pass.vercel.app"
  ).replace(/\/$/, "");

  const tokenUrl = profile.private_token
    ? `${siteUrl}/u/${profile.private_token}`
    : null;

  const qrUrl = tokenUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(tokenUrl)}&size=600`
    : null;

  if (!process.env.RESEND_API_KEY || !tokenUrl || !qrUrl) return;

  const customerName = profile.full_name || "—";
  const customerEmail = profile.email || "—";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SignalPass <notifications@signalpass.app>",
      to: "john@signalpass.app",
      subject: `New SignalPass founder card ready: ${customerName || customerEmail}`,
      html: `
        <h2>New SignalPass founder card ready</h2>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Promo:</strong> FOUNDERS</p>
        <p><strong>Slug:</strong> ${profile.slug || "—"}</p>
        <p><strong>Token URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>
        <p><strong>QR image URL:</strong> <a href="${qrUrl}">${qrUrl}</a></p>
        <p><img src="${qrUrl}" alt="QR code" width="300" height="300" /></p>
      `,
    }),
  });

  await admin
    .from("profiles")
    .update({ card_notification_sent_at: new Date().toISOString() })
    .or(`user_id.eq.${userId},id.eq.${userId}`);
}

function isDuplicateProfileError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() || "";
  return error?.code === "23505" || message.includes("duplicate");
}

function setupRecoveryRedirect(req: Request, nextPath: string, requestedPlan: string | null) {
  const recoveryUrl = new URL("/auth/setup-error", req.url);
  recoveryUrl.searchParams.set("reason", "profile_bootstrap");
  recoveryUrl.searchParams.set("next", nextPath);

  if (requestedPlan) {
    recoveryUrl.searchParams.set("plan", requestedPlan);
  }

  return NextResponse.redirect(recoveryUrl);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const requestedPlan = cleanValue(url.searchParams.get("plan"));
  const fallbackNext = requestedPlan
    ? `/api/checkout?plan=${encodeURIComponent(requestedPlan)}`
    : "/dashboard";
  const nextPath = safeInternalRedirect(url.searchParams.get("next"), fallbackNext);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  const firstName = cleanValue(meta.first_name);
  const lastName = cleanValue(meta.last_name);
  const fullName =
    cleanValue(meta.full_name) ||
    cleanValue([firstName, lastName].filter(Boolean).join(" "));
  const suggestedSlug =
    cleanValue(meta.suggested_slug) ||
    (fullName ? slugify(fullName) : user.email ? slugify(user.email.split("@")[0]) : null);

  const promoCode = cleanValue(meta.promo_code)?.toUpperCase() || null;
  const referralCode = cleanValue(meta.referral_code_used);
  const isPublicOfficial = Boolean(meta.is_public_official);

  const { data: existingProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Profile bootstrap lookup failed", {
      userId: user.id,
      error: lookupError.message
    });
    return setupRecoveryRedirect(req, nextPath, requestedPlan);
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      email: user.email || null,
      full_name: fullName,
      slug: suggestedSlug,
      promo_code_used: promoCode,
      referral_code_used: referralCode,
      is_public_official: isPublicOfficial,
      lifetime_free: promoCode === "FOUNDERS",
      billing_exempt: promoCode === "FOUNDERS",
      stripe_plan_key: promoCode === "FOUNDERS" ? "founder" : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (insertError) {
      // A duplicate can happen if the callback is retried in two tabs; recover by fetching the profile.
      if (isDuplicateProfileError(insertError)) {
        const { data: duplicateProfile, error: duplicateLookupError } = await supabase
          .from("profiles")
          .select("id, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (duplicateLookupError || !duplicateProfile) {
          console.error("Profile bootstrap duplicate recovery failed", {
            userId: user.id,
            error: duplicateLookupError?.message || insertError.message
          });
          return setupRecoveryRedirect(req, nextPath, requestedPlan);
        }
      } else {
        console.error("Profile bootstrap insert failed", {
          userId: user.id,
          error: insertError.message
        });
        return setupRecoveryRedirect(req, nextPath, requestedPlan);
      }
    }

    if (promoCode === "FOUNDERS") {
      await sendFounderCardNotification(user.id).catch((error) => {
        console.error("Founder card notification failed after profile bootstrap", {
          userId: user.id,
          error: error instanceof Error ? error.message : "Unknown notification error"
        });
      });
    }
  } else if (promoCode === "FOUNDERS") {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        promo_code_used: promoCode,
        lifetime_free: true,
        billing_exempt: true,
        stripe_plan_key: "founder",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile bootstrap founder update failed", {
        userId: user.id,
        error: updateError.message
      });
      return setupRecoveryRedirect(req, nextPath, requestedPlan);
    }

    await sendFounderCardNotification(user.id).catch((error) => {
      console.error("Founder card notification failed after founder profile update", {
        userId: user.id,
        error: error instanceof Error ? error.message : "Unknown notification error"
      });
    });
  }

  return NextResponse.redirect(new URL(nextPath, req.url));
}
