import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";
import { requireTapTaggAdmin } from "@/lib/auth/admin";
import { normalizeIndividualPlanKey } from "@/lib/plans";

type AdminUserPayload = {
  full_name?: unknown;
  email?: unknown;
  slug?: unknown;
  overrideRestrictedSlug?: unknown;
  is_active?: unknown;
  billing_exempt?: unknown;
  is_affiliate?: unknown;
  affiliate_tier?: unknown;
  is_public_official?: unknown;
  stripe_plan_key?: unknown;
};

function parseAdminUserPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as AdminUserPayload;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!slug) return null;

  return {
    full_name: typeof body.full_name === "string" ? body.full_name.trim() : "",
    email,
    slug,
    overrideRestrictedSlug: body.overrideRestrictedSlug === true,
    is_active: body.is_active === true,
    billing_exempt: body.billing_exempt === true,
    is_affiliate: body.is_affiliate === true,
    affiliate_tier: typeof body.affiliate_tier === "string" ? body.affiliate_tier.trim() || null : null,
    is_public_official: body.is_public_official === true,
    stripe_plan_key:
      typeof body.stripe_plan_key === "string" && body.stripe_plan_key.trim()
        ? normalizeIndividualPlanKey(body.stripe_plan_key)
        : null
  };
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
  const adminUser = await requireTapTaggAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await params;
  const body = parseAdminUserPayload(await request.json().catch(() => null));
  if (!body) {
    return NextResponse.json({ error: "Invalid user update request." }, { status: 400 });
  }
  const admin = createAdminClient();

  const moderation = classifySlug(body.slug);

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
  const adminUser = await requireTapTaggAdmin();
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
