import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";
import { buildQuickChartQrUrl } from "@/lib/notifications/qr";
import { sendSlugApprovedEmail } from "@/lib/notifications/send-slug-approved-email";
import { normalizeIndividualPlanKey } from "@/lib/plans";
import { requireCapturePassAdmin } from "@/lib/auth/admin";
import {
  ALLOWED_AFFILIATE_TIERS,
  ALLOWED_BOOLEAN_FIELDS,
  isKnownPlanOverride,
  parseAdminUserUpdateRequest,
  parseBooleanField,
  type AdminUserUpdateRequest
} from "@/lib/validation/admin-user-update";
import type { ProfileRecord } from "@/lib/types";

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
async function sendCardProductionEmail(profile: ProfileRecord) {
  if (!process.env.RESEND_API_KEY || profile.card_notification_sent_at) return;

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://capturepass.com").replace(/\/$/, "");
  const tokenUrl = profile.private_token ? `${siteUrl}/u/${profile.private_token}` : null;
  const qrUrl = buildQuickChartQrUrl(tokenUrl);

  if (!tokenUrl || !qrUrl) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "CapturePass <notifications@capturepass.com>",
      to: "support@capturepass.com",
      subject: `New CapturePass card ready: ${profile.full_name || profile.email}`,
      html: `
        <h2>New CapturePass card ready</h2>
        <p><strong>Name:</strong> ${profile.full_name || "—"}</p>
        <p><strong>Email:</strong> ${profile.email || "—"}</p>
        <p><strong>Slug:</strong> ${profile.slug || "—"}</p>
        <p><strong>Issued card URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireCapturePassAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await params;
  let body: AdminUserUpdateRequest | null = null;
  try {
    body = parseAdminUserUpdateRequest(await request.json());
  } catch (error) {
    console.error("Admin user update payload parse failed", {
      route: "/api/admin/users/[userId]",
      targetUserId: userId,
      error: error instanceof Error ? error.message : "Invalid JSON"
    });
    return NextResponse.json({ error: "Invalid user update request." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Invalid user update request." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: currentProfile, error: currentError } = await admin
    .from("profiles")
    .select("user_id, full_name, email, slug, private_token, slug_requested, slug_status, slug_review_reason, is_active, billing_exempt, is_affiliate, affiliate_tier, is_public_official, stripe_customer_id, stripe_plan_key, promo_code_used, consent_public_visibility, role_line, intro, phone, text_phone, website_url, primary_link_1_title, primary_link_1_url, primary_link_1_type, primary_link_2_title, primary_link_2_url, primary_link_2_type, primary_link_3_title, primary_link_3_url, primary_link_3_type, primary_link_4_title, primary_link_4_url, primary_link_4_type, subscription_status, card_notification_sent_at")
    .eq("user_id", userId)
    .single();

  if (currentError || !currentProfile) {
    console.error("Admin user profile lookup failed", {
      route: "/api/admin/users/[userId]",
      adminUserId: adminUser.id,
      targetUserId: userId,
      error: currentError?.message || "Profile not found"
    });
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const moderation = classifySlug(body.field === "slug" ? body.value : "");

  const profileUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  const authUpdates: { email?: string; user_metadata?: { full_name?: string } } = {};
  const nextProfileValue = (key: string) =>
    Object.prototype.hasOwnProperty.call(profileUpdates, key)
      ? profileUpdates[key]
      : currentProfile[key as keyof typeof currentProfile];

  switch (body.field) {
    case "full_name": {
      const fullName = body.value.trim();
      profileUpdates.full_name = fullName;
      authUpdates.user_metadata = { full_name: fullName };
      break;
    }
    case "email": {
      const nextEmail = body.value.trim().toLowerCase();
      if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      }
      profileUpdates.email = nextEmail;
      authUpdates.email = nextEmail;
      break;
    }
    case "slug": {
      if (!body.value.trim()) {
        return NextResponse.json({ error: "Slug cannot be empty." }, { status: 400 });
      }

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

      profileUpdates.slug = moderation.normalized;
      profileUpdates.slug_requested = null;
      profileUpdates.slug_status = "approved";
      profileUpdates.slug_review_reason =
        moderation.state === "review" ? "approved_by_admin_override" : null;
      break;
    }
    case "organization_name":
    case "role_line":
    case "intro":
    case "phone":
    case "text_phone":
    case "website_url":
    case "promo_code_used":
    case "subscription_status":
      (profileUpdates as Record<string, unknown>)[body.field] = body.value.trim() || null;
      break;
    case "referral_code": {
      const referral = body.value.trim().toUpperCase();
      (profileUpdates as Record<string, unknown>).referral_code = referral || null;
      (profileUpdates as Record<string, unknown>).is_affiliate = !!referral;
      break;
    }
    case "stripe_plan_key": {
      const planInput = body.value.trim();
      if (planInput && !isKnownPlanOverride(planInput)) {
        return NextResponse.json({ error: "Invalid plan override." }, { status: 400 });
      }

      const normalizedPlan = normalizeIndividualPlanKey(planInput || null);
      profileUpdates.stripe_plan_key = planInput ? normalizedPlan : null;
      break;
    }
    case "affiliate_tier": {
      const tier = body.value.trim().toLowerCase();
      if (tier && !ALLOWED_AFFILIATE_TIERS.has(tier)) {
        return NextResponse.json({ error: "Invalid affiliate tier." }, { status: 400 });
      }
      (profileUpdates as Record<string, unknown>).affiliate_tier = tier || null;
      (profileUpdates as Record<string, unknown>).is_affiliate = !!tier;
      break;
    }
    case "consent_public_visibility":
    case "is_active":
    case "billing_exempt":
    case "is_affiliate":
    case "is_public_official":
      if (!ALLOWED_BOOLEAN_FIELDS.has(body.field)) {
        return NextResponse.json({ error: "That field cannot be updated from this endpoint." }, { status: 400 });
      }
      (profileUpdates as Record<string, unknown>)[body.field] = parseBooleanField(body.value);
      break;
    default:
      return NextResponse.json({ error: "That field cannot be updated from this endpoint." }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update(profileUpdates)
    .eq("user_id", userId);

  if (profileError) {
    console.error("Admin user profile update failed", {
      route: "/api/admin/users/[userId]",
      adminUserId: adminUser.id,
      targetUserId: userId,
      error: profileError.message
    });
    return NextResponse.json({ error: "Unable to update this profile. Please try again." }, { status: 400 });
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
        slug: nextProfileValue("slug") ?? currentProfile.slug,
        slug_status: nextProfileValue("slug_status") ?? currentProfile.slug_status,
        is_active: nextProfileValue("is_active") ?? currentProfile.is_active,
        billing_exempt: nextProfileValue("billing_exempt") ?? currentProfile.billing_exempt,
        is_affiliate: nextProfileValue("is_affiliate") ?? currentProfile.is_affiliate,
        affiliate_tier: nextProfileValue("affiliate_tier") ?? currentProfile.affiliate_tier,
        is_public_official: nextProfileValue("is_public_official") ?? currentProfile.is_public_official,
        stripe_plan_key: nextProfileValue("stripe_plan_key") ?? currentProfile.stripe_plan_key
      }
    }
  });

  if (authUpdates.email || authUpdates.user_metadata?.full_name !== undefined) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      ...(authUpdates.email ? { email: authUpdates.email } : {}),
      ...(authUpdates.user_metadata ? { user_metadata: authUpdates.user_metadata } : {})
    });

    if (authError) {
      console.error("Admin auth user update failed", {
        route: "/api/admin/users/[userId]",
        adminUserId: adminUser.id,
        targetUserId: userId,
        error: authError.message
      });
      return NextResponse.json({ error: "Profile updated, but the auth account could not be updated." }, { status: 400 });
    }
  }

  const becameApproved =
    currentProfile.slug_status !== "approved" ||
    currentProfile.slug !== (nextProfileValue("slug") ?? currentProfile.slug);
  const nextProfile = {
    ...currentProfile,
    ...profileUpdates
  } as ProfileRecord;

  if (becameApproved) {
    try {
      await sendSlugApprovedEmail(nextProfile);
    } catch (emailError) {
      console.error("Admin slug approval notification failed", {
        route: "/api/admin/users/[userId]",
        targetUserId: userId,
        approvedSlug: profileUpdates.slug ?? currentProfile.slug,
        error: emailError instanceof Error ? emailError.message : "Unknown email error"
      });
    }
  }

  // --- Card production email for admin/founder activations (non-Stripe) ---
  const becameActiveOutsideStripe =
    !currentProfile.is_active && !!nextProfileValue("is_active") && !currentProfile.stripe_customer_id;
  const becameBillingExempt = !currentProfile.billing_exempt && !!nextProfileValue("billing_exempt");

  if (becameActiveOutsideStripe || becameBillingExempt) {
    try {
      await sendCardProductionEmail(nextProfile);
    } catch (emailError) {
      console.error("Card production email failed:", emailError);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireCapturePassAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await params;
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) {
    console.error("Admin token/QR resend profile lookup failed", {
      route: "/api/admin/users/[userId]",
      adminUserId: adminUser.id,
      targetUserId: userId,
      error: error?.message || "Profile not found"
    });
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  try {
    await sendSlugApprovedEmail(profile);
  } catch (emailError) {
    console.error("Admin token/QR resend notification failed", {
      route: "/api/admin/users/[userId]",
      adminUserId: adminUser.id,
      targetUserId: userId,
      error: emailError instanceof Error ? emailError.message : "Unknown email error"
    });
    return NextResponse.json(
      { error: "Unable to resend the Token/QR email. Please try again." },
      { status: 400 }
    );
  }

  await writeAdminAuditLog({
    adminEmail: adminUser.email || "unknown-admin",
    targetUserId: userId,
    action: "token_qr_email_resent",
    details: {
      profile_email: profile.email || null,
      profile_name: profile.full_name || null,
      slug: profile.slug || null
    }
  });

  return NextResponse.json({ ok: true, message: "Token/QR email resent." });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await requireCapturePassAdmin();
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
    console.error("Admin user profile delete failed", {
      route: "/api/admin/users/[userId]",
      adminUserId: adminUser.id,
      targetUserId: userId,
      error: profileError.message
    });
    return NextResponse.json({ error: "Unable to delete this profile. Please try again." }, { status: 400 });
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Admin auth user delete failed", {
      route: "/api/admin/users/[userId]",
      adminUserId: adminUser.id,
      targetUserId: userId,
      error: authError.message
    });
    return NextResponse.json({ error: "Profile deleted, but the auth account could not be deleted." }, { status: 400 });
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
