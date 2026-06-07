import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWebhookTestPayload, sendOrganizationWebhook } from "@/lib/webhooks/sendWebhook";
import { getCurrentTapTaggAdmin } from "@/lib/auth/admin";

async function requireBusinessAdmin(organizationId: string) {
  const platformAdmin = await getCurrentTapTaggAdmin();
  if (platformAdmin) return platformAdmin;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError || !organization) return null;
  if (organization.owner_user_id === user.id) return user;

  const { data: member } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin", "super_admin", "business_admin"])
    .maybeSingle();

  return member ? user : null;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { organization_id?: string } | null;
  const organizationId = String(payload?.organization_id || "").trim();

  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Organization is required." }, { status: 400 });
  }

  const adminUser = await requireBusinessAdmin(organizationId);
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: organization }, { data: webhookSettings }] = await Promise.all([
    admin.from("organizations").select("id, name").eq("id", organizationId).maybeSingle(),
    admin
      .from("organization_webhooks")
      .select("id, organization_id, enabled, webhook_url, webhook_secret, created_at, updated_at")
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (!organization) {
    return NextResponse.json({ ok: false, error: "Organization not found." }, { status: 404 });
  }

  if (!webhookSettings?.enabled) {
    const { data: delivery, error: insertError } = await admin.from("webhook_deliveries").insert({
      organization_id: organizationId,
      event_type: "webhook.test",
      status_code: null,
      success: false,
      response_body: null,
      error_message: webhookSettings ? "disabled" : "missing_settings"
    }).select("id").maybeSingle();

    if (insertError) {
      console.error("organization_webhook_test_log_failed", {
        organizationId,
        error: insertError.message
      });
    }

    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: webhookSettings ? "disabled" : "missing_settings",
      delivery_id: delivery?.id || null,
      message: webhookSettings ? "Webhooks are disabled for this organization." : "Webhook settings have not been created yet."
    });
  }

  const result = await sendOrganizationWebhook({
    organizationId,
    event: "webhook.test",
    payload: buildWebhookTestPayload(organization)
  });

  return NextResponse.json({
    ok: true,
    ...result,
    message: result.delivered
      ? "Test webhook sent."
      : result.skipped
        ? "Webhook test skipped."
        : "Test webhook failed."
  });
}
