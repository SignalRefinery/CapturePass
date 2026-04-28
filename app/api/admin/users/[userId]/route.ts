import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";
import { sendSlugApprovedEmail } from "@/lib/notifications/send-slug-approved-email";


const ADMIN_EMAILS = ["john@signalrefinery.pro"];

// --- Admin Audit Log helper ---
async function writeAdminAuditLog({
  adminEmail,
  targetUserId,
  action,
  details
}: {
  adminEmail: string;
  targetUserId: string;
  action: string;
  details?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_email: adminEmail,
      target_user_id: targetUserId,
      action,
      details: details || {}
    });
  } catch (auditError) {
    console.error("Admin audit log failed:", auditError);
  }
}

// --- Card production notification email helper ---
async function sendCardProductionEmail(profile: any) {
  if (!process.env.RESEND_API_KEY || profile.card_notification_sent_at) return;

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://signal-pass.vercel.app").replace(/\/$/, "");
  const tokenUrl = profile.private_token ? `${siteUrl}/u/${profile.private_token}` : null;
  const qrUrl = tokenUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(tokenUrl)}&size=600`
    : null;

  if (!tokenUrl || !qrUrl) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "SignalPass <notifications@signalpass.app>",
      to: "john@signalpass.app",
      subject: `New SignalPass card ready: ${profile.full_name || profile.email}`,
      html: `
        <h2>New SignalPass card ready</h2>
        <p><strong>Name:</strong> ${profile.full_name || "—"}</p>
        <p><strong>Email:</strong> ${profile.email || "—"}</p>
        <p><strong>Slug:</strong> ${profile.slug || "—"}</p>
        <p><strong>Token URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>
        <p><strong>QR image URL:</strong> <a href="${qrUrl}">${qrUrl}</a></p>
        <p><img src="${qrUrl}" alt="QR code" width="300" height="300" /></p>
      `
    })
  });

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ card_notification_sent_at: new Date().toISOString() })
    .or(`user_id.eq.${profile.user_id},id.eq.${profile.user_id}`);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return user;
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    return null;
  }

  return user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data: currentProfile, error: currentError } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (currentError || !currentProfile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const moderation = classifySlug(body.slug || "");

  if (moderation.state === "blocked") {
    return NextResponse.json({ error: moderation.reason || "That slug is blocked." }, { status: 400 });
  }

  if (moderation.state === "review" && !body.overrideRestrictedSlug) {
    return NextResponse.json(
      { error: moderation.reason || "That slug requires admin approval override." },
      { status: 400 }
    );
  }

  const { data: slugOwner } = await admin
    .from("profiles")
    .select("user_id")
    .eq("slug", moderation.normalized)
    .neq("user_id", userId)
    .maybeSingle();

  if (slugOwner) {
    return NextResponse.json({ error: "That slug is already in use." }, { status: 400 });
  }

  const approvedStatus = "approved";
  const slugReviewReason = moderation.state === "review" ? "approved_by_admin_override" : null;

  const updatedProfile = {
    ...currentProfile,
    full_name: body.full_name || "",
    email: body.email || "",
    slug: moderation.normalized,
    slug_requested: null,
    slug_status: approvedStatus,
    slug_review_reason: slugReviewReason,
    is_active: !!body.is_active,
    billing_exempt: !!body.billing_exempt,
    is_affiliate: !!body.is_affiliate,
    affiliate_tier: body.affiliate_tier || null,
    is_public_official: !!body.is_public_official,
    stripe_plan_key: body.stripe_plan_key || null,
    updated_at: new Date().toISOString()
  };

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: updatedProfile.full_name,
      email: updatedProfile.email,
      slug: updatedProfile.slug,
      slug_requested: updatedProfile.slug_requested,
      slug_status: updatedProfile.slug_status,
      slug_review_reason: updatedProfile.slug_review_reason,
      is_active: updatedProfile.is_active,
      billing_exempt: updatedProfile.billing_exempt,
      is_affiliate: updatedProfile.is_affiliate,
      affiliate_tier: updatedProfile.affiliate_tier,
      is_public_official: updatedProfile.is_public_official,
      stripe_plan_key: updatedProfile.stripe_plan_key,
      updated_at: updatedProfile.updated_at
    })
    .eq("user_id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // --- Admin audit log after profile update ---
  await writeAdminAuditLog({
    adminEmail: adminUser.email || "unknown-admin",
    targetUserId: userId,
    action: "profile_updated",
    details: {
      previous: {
        slug: currentProfile.slug,
        slug_status: currentProfile.slug_status,
        is_active: currentProfile.is_active,
        billing_exempt: currentProfile.billing_exempt,
        is_affiliate: currentProfile.is_affiliate,
        affiliate_tier: currentProfile.affiliate_tier,
        is_public_official: currentProfile.is_public_official,
        stripe_plan_key: currentProfile.stripe_plan_key
      },
      next: {
        slug: updatedProfile.slug,
        slug_status: updatedProfile.slug_status,
        is_active: updatedProfile.is_active,
        billing_exempt: updatedProfile.billing_exempt,
        is_affiliate: updatedProfile.is_affiliate,
        affiliate_tier: updatedProfile.affiliate_tier,
        is_public_official: updatedProfile.is_public_official,
        stripe_plan_key: updatedProfile.stripe_plan_key
      }
    }
  });

  if (body.email || body.full_name) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email: body.email || undefined,
      user_metadata: {
        full_name: body.full_name || ""
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  }

  const becameApproved =
    currentProfile.slug_status !== "approved" || currentProfile.slug !== updatedProfile.slug;

  if (becameApproved) {
    try {
      await sendSlugApprovedEmail(updatedProfile);
    } catch (emailError) {
      console.error(emailError);
    }
  }

  // --- Card production email for admin/founder activations (non-Stripe) ---
  const becameActiveOutsideStripe =
    !currentProfile.is_active && updatedProfile.is_active && !updatedProfile.stripe_customer_id;
  const becameBillingExempt = !currentProfile.billing_exempt && updatedProfile.billing_exempt;

  if (becameActiveOutsideStripe || becameBillingExempt) {
    try {
      await sendCardProductionEmail(updatedProfile);
    } catch (emailError) {
      console.error("Card production email failed:", emailError);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await params;
  const admin = createAdminClient();

  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("user_id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // --- Admin audit log for user deletion ---
  await writeAdminAuditLog({
    adminEmail: adminUser.email || "unknown-admin",
    targetUserId: userId,
    action: "user_deleted",
    details: {}
  });

  return NextResponse.json({ ok: true });
}
