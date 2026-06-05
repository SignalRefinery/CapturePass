import { NextResponse } from "next/server";
import { getBusinessPlan } from "@/lib/business/plans";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { claimBusinessOrganizationForUser, getBusinessTypeForUser } from "@/lib/business/organization-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";

function cleanValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://taptagg.app"
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
      from: "TapTagg <notifications@taptagg.app>",
      to: "john@taptagg.app",
      subject: `New TapTagg founder card ready: ${customerName || customerEmail}`,
      html: `
        <h2>New TapTagg founder card ready</h2>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Promo:</strong> FOUNDERS</p>
        <p><strong>Slug:</strong> ${profile.slug || "—"}</p>
        <p><strong>Issued card URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>
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

function safeFallbackSlugForUser(userId: string) {
  return `profile-${userId.replace(/-/g, "").slice(0, 12)}`;
}

async function slugIsAvailable(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string,
  userId: string
) {
  const { data: activeOwner, error: activeError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("slug", slug)
    .neq("user_id", userId)
    .limit(1);

  if (activeError) return false;
  if (activeOwner?.length) return false;

  const { data: requestedOwner, error: requestedError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("slug_requested", slug)
    .neq("user_id", userId)
    .limit(1);

  if (requestedError) return false;
  return !requestedOwner?.length;
}

async function getBootstrapSlugFields(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  rawSuggestedSlug: string | null
) {
  const fallbackSlug = safeFallbackSlugForUser(userId);
  const fallbackModeration = classifySlug(fallbackSlug);
  const safeFallbackSlug =
    fallbackModeration.state === "allowed" ? fallbackModeration.normalized : `profile-${Date.now()}`;
  const suggestedModeration = classifySlug(rawSuggestedSlug || safeFallbackSlug);

  if (
    suggestedModeration.state === "allowed" &&
    (await slugIsAvailable(supabase, suggestedModeration.normalized, userId))
  ) {
    return {
      slug: suggestedModeration.normalized,
      slug_requested: null,
      slug_status: "approved",
      slug_review_reason: null
    };
  }

  // Signup bootstrap must never publish restricted or impersonation-prone
  // slugs. Reviewable suggestions are held for admin approval behind a safe URL.
  if (suggestedModeration.state === "review") {
    return {
      slug: safeFallbackSlug,
      slug_requested: suggestedModeration.normalized,
      slug_status: "pending_review",
      slug_review_reason: suggestedModeration.reason
    };
  }

  return {
    slug: safeFallbackSlug,
    slug_requested: null,
    slug_status: "approved",
    slug_review_reason:
      suggestedModeration.state === "blocked" ? "blocked_name_based_slug_fallback" : null
  };
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
  const profileAdmin = createAdminClient();

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
  const rawSuggestedSlug =
    cleanValue(meta.suggested_slug) ||
    (fullName || (user.email ? user.email.split("@")[0] : null));

  const promoCode = cleanValue(meta.promo_code)?.toUpperCase() || null;
  const referralCode = cleanValue(meta.referral_code_used);
  const isPublicOfficial = Boolean(meta.is_public_official);
  const requestedBusinessPlan = requestedPlan ? getBusinessPlan(requestedPlan) : null;
  const isBusinessCheckoutContinuation =
    !!requestedBusinessPlan || (/^\/api\/checkout\?/.test(nextPath) && nextPath.includes("plan=business"));
  const finalNextPath = promoCode === "FOUNDERS" && !isBusinessCheckoutContinuation ? "/dashboard" : nextPath;

  if (meta.business_only === true || meta.business_only === "true") {
    await claimBusinessOrganizationForUser({
      userId: user.id,
      email: user.email,
      organizationId: cleanValue(meta.organization_id),
      roles: ["owner", "admin", "member"]
    });

    return NextResponse.redirect(new URL(nextPath, req.url));
  }

  const { data: existingProfile, error: lookupError } = await profileAdmin
    .from("profiles")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Profile bootstrap lookup failed", {
      userId: user.id,
      error: lookupError.message
    });
    return setupRecoveryRedirect(req, finalNextPath, requestedPlan);
  }

  if (!existingProfile) {
    const bootstrapSlugFields = await getBootstrapSlugFields(profileAdmin, user.id, rawSuggestedSlug);
    const businessType = await getBusinessTypeForUser(user.id);

    const { error: insertError } = await profileAdmin.from("profiles").insert({
      user_id: user.id,
      business_type: businessType,
      email: user.email || null,
      full_name: fullName,
      ...bootstrapSlugFields,
      promo_code_used: promoCode,
      referred_by: referralCode,
      is_public_official: isPublicOfficial,
      is_active: promoCode === "FOUNDERS",
      lifetime_free: promoCode === "FOUNDERS",
      billing_exempt: promoCode === "FOUNDERS",
      stripe_plan_key: promoCode === "FOUNDERS" ? "creator" : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (insertError) {
      // A duplicate can happen if the callback is retried in two tabs; recover by fetching the profile.
      if (isDuplicateProfileError(insertError)) {
        const { data: duplicateProfile, error: duplicateLookupError } = await profileAdmin
          .from("profiles")
          .select("id, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (duplicateLookupError || !duplicateProfile) {
          console.error("Profile bootstrap duplicate recovery failed", {
            userId: user.id,
            error: duplicateLookupError?.message || insertError.message
          });
          return setupRecoveryRedirect(req, finalNextPath, requestedPlan);
        }
      } else {
        console.error("Profile bootstrap insert failed", {
          userId: user.id,
          error: insertError.message
        });
        return setupRecoveryRedirect(req, finalNextPath, requestedPlan);
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
    const { error: updateError } = await profileAdmin
      .from("profiles")
      .update({
        promo_code_used: promoCode,
        is_active: true,
        lifetime_free: true,
        billing_exempt: true,
        stripe_plan_key: "creator",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile bootstrap founder update failed", {
        userId: user.id,
        error: updateError.message
      });
      return setupRecoveryRedirect(req, finalNextPath, requestedPlan);
    }

    await sendFounderCardNotification(user.id).catch((error) => {
      console.error("Founder card notification failed after founder profile update", {
        userId: user.id,
        error: error instanceof Error ? error.message : "Unknown notification error"
      });
    });
  }

  return NextResponse.redirect(new URL(finalNextPath, req.url));
}
