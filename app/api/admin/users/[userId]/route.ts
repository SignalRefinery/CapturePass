import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";
import { sendSlugApprovedEmail } from "@/lib/notifications/send-slug-approved-email";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
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

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("user_id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
