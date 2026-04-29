

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return user;
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  if (error || !profile?.is_admin) return null;

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const adminUser = await requireAdmin();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { profileId } = await params;
  const body = await request.json().catch(() => ({}));
  const reconciled = !!body.reconciled;
  const admin = createAdminClient();

  const updatePayload = reconciled
    ? {
        referral_reconciled: true,
        referral_reconciled_at: new Date().toISOString(),
        referral_reconciled_by: adminUser.email || null
      }
    : {
        referral_reconciled: false,
        referral_reconciled_at: null,
        referral_reconciled_by: null
      };

  const { data, error } = await admin
    .from("profiles")
    .update(updatePayload)
    .or(`user_id.eq.${profileId},id.eq.${profileId}`)
    .select("user_id, referral_code_used, referral_reconciled, referral_reconciled_at, referral_reconciled_by")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Referral profile not found." }, { status: 404 });
  }

  await writeAdminAuditLog({
    adminEmail: adminUser.email || "unknown-admin",
    targetUserId: data.user_id || profileId,
    action: reconciled ? "referral_reconciled" : "referral_unreconciled",
    details: {
      referral_code_used: data.referral_code_used || null,
      referral_reconciled: data.referral_reconciled || false,
      referral_reconciled_at: data.referral_reconciled_at || null
    }
  });

  return NextResponse.json({
    ok: true,
    referral_reconciled: data.referral_reconciled,
    referral_reconciled_at: data.referral_reconciled_at,
    referral_reconciled_by: data.referral_reconciled_by
  });
}