import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

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

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: body.full_name || "",
      email: body.email || "",
      slug: moderation.normalized,
      slug_requested: null,
      slug_status: "approved",
      slug_review_reason: moderation.state === "review" ? "approved_by_admin_override" : null,
      is_active: !!body.is_active,
      billing_exempt: !!body.billing_exempt,
      is_affiliate: !!body.is_affiliate,
      affiliate_tier: body.affiliate_tier || null,
      is_public_official: !!body.is_public_official,
      stripe_plan_key: body.stripe_plan_key || null,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await writeAdminAuditLog({
    adminEmail: adminUser.email || "unknown-admin",
    targetUserId: userId,
    action: "profile_updated",
    details: {
      slug: moderation.normalized,
      is_active: !!body.is_active,
      billing_exempt: !!body.billing_exempt,
      is_affiliate: !!body.is_affiliate,
      affiliate_tier: body.affiliate_tier || null,
      is_public_official: !!body.is_public_official,
      stripe_plan_key: body.stripe_plan_key || null
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

  await writeAdminAuditLog({
    adminEmail: adminUser.email || "unknown-admin",
    targetUserId: userId,
    action: "user_deleted",
    details: {}
  });

  return NextResponse.json({ ok: true });
}
