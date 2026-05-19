import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";
import { sendSlugApprovedEmail } from "@/lib/notifications/send-slug-approved-email";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

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
    // Moderation should not fail after the profile mutation solely because
    // audit persistence is temporarily unavailable, but operators need logs.
    console.error("Admin slug review audit log failed:", auditError);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    console.error("Unauthorized slug review attempt", {
      route: "/api/admin/slug-review",
      userId: user.id,
      email: user.email
    });
    return NextResponse.json({ error: "You do not have permission to review slugs." }, { status: 403 });
  }

  let body: { userId?: string; action?: "approve" | "deny" };
  try {
    body = await request.json();
  } catch (error) {
    console.error("Slug review payload parse failed", {
      route: "/api/admin/slug-review",
      adminUserId: user.id,
      error: error instanceof Error ? error.message : "Invalid JSON"
    });
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }

  const userId = body.userId as string | undefined;
  const action = body.action as "approve" | "deny" | undefined;

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing review payload." }, { status: 400 });
  }

  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ error: "Invalid slug review action." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Slug review profile lookup failed", {
      route: "/api/admin/slug-review",
      adminUserId: user.id,
      targetUserId: userId,
      action,
      error: profileError?.message || "Profile not found"
    });
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (!profile.slug_requested) {
    return NextResponse.json({ error: "No slug request is pending." }, { status: 400 });
  }

  if (action === "deny") {
    const reviewedAt = new Date().toISOString();
    const { error } = await admin
      .from("profiles")
      .update({
        slug_requested: null,
        slug_status: "rejected",
        slug_review_reason: "denied_by_admin",
        updated_at: reviewedAt
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Slug review denial update failed", {
        route: "/api/admin/slug-review",
        adminUserId: user.id,
        targetUserId: userId,
        requestedSlug: profile.slug_requested,
        error: error.message
      });
      return NextResponse.json({ error: "Unable to deny this slug request. Please try again." }, { status: 400 });
    }

    await writeAdminAuditLog({
      adminEmail: user.email || "unknown-admin",
      targetUserId: userId,
      action: "slug_denied",
      details: {
        previous_slug: profile.slug || null,
        requested_slug: profile.slug_requested,
        profile_email: profile.email || null,
        profile_name: profile.full_name || null,
        reviewed_at: reviewedAt
      }
    });

    return NextResponse.json({ ok: true, message: "Slug request denied." });
  }

  const moderation = classifySlug(profile.slug_requested);

  if (moderation.state === "blocked") {
    return NextResponse.json({ error: "That requested slug is blocked and cannot be approved." }, { status: 400 });
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

  const approvedAt = new Date().toISOString();
  const updatedProfile = {
    ...profile,
    slug: moderation.normalized,
    slug_requested: null,
    slug_status: "approved",
    slug_review_reason: "approved_by_admin",
    updated_at: approvedAt
  };

  const { error } = await admin
    .from("profiles")
    .update({
      slug: updatedProfile.slug,
      slug_requested: updatedProfile.slug_requested,
      slug_status: updatedProfile.slug_status,
      slug_review_reason: updatedProfile.slug_review_reason,
      updated_at: updatedProfile.updated_at
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Slug review approval update failed", {
      route: "/api/admin/slug-review",
      adminUserId: user.id,
      targetUserId: userId,
      requestedSlug: profile.slug_requested,
      approvedSlug: updatedProfile.slug,
      error: error.message
    });
    return NextResponse.json({ error: "Unable to approve this slug request. Please try again." }, { status: 400 });
  }

  try {
    await sendSlugApprovedEmail(updatedProfile);
  } catch (emailError) {
    console.error("Slug approval notification failed", {
      route: "/api/admin/slug-review",
      targetUserId: userId,
      approvedSlug: updatedProfile.slug,
      error: emailError instanceof Error ? emailError.message : "Unknown email error"
    });
  }

  await writeAdminAuditLog({
    adminEmail: user.email || "unknown-admin",
    targetUserId: userId,
    action: "slug_approved",
    details: {
      previous_slug: profile.slug || null,
      requested_slug: profile.slug_requested,
      approved_slug: updatedProfile.slug,
      profile_email: profile.email || null,
      profile_name: profile.full_name || null,
      reviewed_at: approvedAt
    }
  });

  return NextResponse.json({ ok: true, message: "Slug request approved." });
}
