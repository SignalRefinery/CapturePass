import { createHmac, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactSubmissionRecord, OrganizationMemberRecord, OrganizationRecord, OrganizationWebhookRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

export type OrganizationWebhookEvent =
  | "contact.shared"
  | "employee.activated"
  | "employee.deactivated"
  | "webhook.test";

export type OrganizationWebhookDeliveryResult = {
  delivered: boolean;
  skipped?: boolean;
  reason?: string;
  statusCode?: number | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  deliveryId?: string | null;
};

type OrganizationContext = Pick<OrganizationRecord, "id" | "name">;
type EmployeeContext = Pick<OrganizationMemberRecord, "id" | "name">;
type ContactContext = Pick<ContactSubmissionRecord, "name" | "email" | "phone" | "company" | "note">;

type WebhookEnvelope = Record<string, unknown>;

function buildTimestamp() {
  return new Date().toISOString();
}

export function normalizeWebhookUrl(value?: string | null) {
  const url = String(value || "").trim();
  if (!url) return null;

  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function buildEmployeeSlug(employee: EmployeeContext) {
  const normalized = slugify(employee.name || "");
  const suffix = employee.id.replace(/-/g, "").slice(0, 8);
  return normalized ? `${normalized}-${suffix}` : `employee-${suffix}`;
}

export function buildContactSharedWebhookPayload({
  organization,
  employee,
  contact
}: {
  organization: OrganizationContext;
  employee: EmployeeContext;
  contact: ContactContext;
}): WebhookEnvelope {
  const timestamp = buildTimestamp();

  return {
    event: "contact.shared",
    timestamp,
    organization: {
      id: organization.id,
      name: organization.name
    },
    employee: {
      id: employee.id,
      name: employee.name,
      slug: buildEmployeeSlug(employee)
    },
    contact: {
      name: contact.name,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      company: contact.company ?? null,
      note: contact.note ?? null
    },
    consent: {
      granted: true
    }
  };
}

export function buildEmployeeWebhookPayload({
  event,
  organization,
  employee,
  status
}: {
  event: "employee.activated" | "employee.deactivated";
  organization: OrganizationContext;
  employee: EmployeeContext;
  status: "active" | "inactive";
}): WebhookEnvelope {
  const timestamp = buildTimestamp();

  return {
    event,
    timestamp,
    organization: {
      id: organization.id,
      name: organization.name
    },
    employee: {
      id: employee.id,
      name: employee.name,
      slug: buildEmployeeSlug(employee),
      status
    }
  };
}

export function buildWebhookTestPayload(organization: OrganizationContext): WebhookEnvelope {
  const timestamp = buildTimestamp();

  return {
    event: "webhook.test",
    timestamp,
    organization: {
      id: organization.id,
      name: organization.name
    },
    message: "TapTagg Business webhook test event."
  };
}

function truncateBody(value: string | null | undefined, max = 4000) {
  if (!value) return null;
  return value.slice(0, max);
}

function signPayload(secret: string, timestamp: string, rawPayload: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawPayload}`).digest("hex");
}

async function loadOrganizationWebhookSettings(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_webhooks")
    .select("id, organization_id, enabled, webhook_url, webhook_secret, created_at, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as OrganizationWebhookRecord | null) || null;
}

function buildDeliveryLog({
  organizationId,
  event,
  success,
  statusCode,
  responseBody,
  errorMessage
}: {
  organizationId: string;
  event: string;
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  errorMessage: string | null;
}) {
  return {
    organization_id: organizationId,
    event_type: event,
    status_code: statusCode,
    success,
    response_body: truncateBody(responseBody),
    error_message: truncateBody(errorMessage)
  };
}

export async function sendOrganizationWebhook({
  organizationId,
  event,
  payload
}: {
  organizationId: string;
  event: OrganizationWebhookEvent;
  payload: WebhookEnvelope;
}): Promise<OrganizationWebhookDeliveryResult> {
  try {
    const settings = await loadOrganizationWebhookSettings(organizationId);

    if (!settings?.enabled) {
      console.info("organization_webhook_skipped", {
        organizationId,
        event,
        reason: settings ? "disabled" : "missing_settings"
      });
      return { delivered: false, skipped: true, reason: settings ? "disabled" : "missing_settings" };
    }

    const webhookUrl = normalizeWebhookUrl(settings.webhook_url);
    if (!webhookUrl || !settings.webhook_secret) {
      const errorMessage = !webhookUrl ? "invalid_webhook_url" : "missing_webhook_secret";

      console.error("organization_webhook_delivery_invalid_settings", {
        organizationId,
        event,
        webhookId: settings.id,
        errorMessage
      });

      const admin = createAdminClient();
      const { data: delivery, error: insertError } = await admin
        .from("webhook_deliveries")
        .insert(
          buildDeliveryLog({
            organizationId,
            event,
            success: false,
            statusCode: null,
            responseBody: null,
            errorMessage
          })
        )
        .select("id")
        .maybeSingle();

      if (insertError) {
        console.error("organization_webhook_delivery_log_failed", {
          organizationId,
          event,
          error: insertError.message
        });
      }

      return {
        delivered: false,
        statusCode: null,
        responseBody: null,
        errorMessage,
        deliveryId: delivery?.id || null
      };
    }

    const timestamp = typeof payload.timestamp === "string" ? payload.timestamp : buildTimestamp();
    const rawPayload = JSON.stringify(payload);
    const signature = signPayload(settings.webhook_secret, timestamp, rawPayload);
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 10_000);

    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let success = false;
    let errorMessage: string | null = null;

    console.info("organization_webhook_attempt", {
      organizationId,
      event,
      webhookId: settings.id,
      webhookUrl
    });

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TapTagg-Event": event,
          "X-TapTagg-Signature": signature,
          "X-TapTagg-Timestamp": timestamp
        },
        body: rawPayload,
        signal: controller.signal
      });

      statusCode = response.status;
      responseBody = truncateBody(await response.text());
      success = response.ok;
      errorMessage = response.ok ? null : `HTTP ${response.status}`;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Unknown webhook delivery error";
    } finally {
      globalThis.clearTimeout(timeout);
    }

    const admin = createAdminClient();
    const { data: delivery, error: insertError } = await admin
      .from("webhook_deliveries")
      .insert(
        buildDeliveryLog({
          organizationId,
          event,
          success,
          statusCode,
          responseBody,
          errorMessage
        })
      )
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("organization_webhook_delivery_log_failed", {
        organizationId,
        event,
        error: insertError.message
      });
    }

    if (success) {
      console.info("organization_webhook_delivered", {
        organizationId,
        event,
        webhookId: settings.id,
        deliveryId: delivery?.id || null,
        statusCode
      });
      return {
        delivered: true,
        statusCode,
        responseBody,
        deliveryId: delivery?.id || null
      };
    }

    console.error("organization_webhook_delivery_failed", {
      organizationId,
      event,
      webhookId: settings.id,
      deliveryId: delivery?.id || null,
      statusCode,
      errorMessage,
      responseBody
    });

    return {
      delivered: false,
      statusCode,
      responseBody,
      errorMessage,
      deliveryId: delivery?.id || null
    };
  } catch (error) {
    console.error("organization_webhook_delivery_error", {
      organizationId,
      event,
      error: error instanceof Error ? error.message : "Unknown webhook error"
    });

    return {
      delivered: false,
      errorMessage: error instanceof Error ? error.message : "Unknown webhook error"
    };
  }
}

export function queueOrganizationWebhook({
  organizationId,
  event,
  payload
}: {
  organizationId: string;
  event: OrganizationWebhookEvent;
  payload: WebhookEnvelope;
}) {
  void sendOrganizationWebhook({ organizationId, event, payload }).catch((error) => {
    console.error("organization_webhook_queue_failed", {
      organizationId,
      event,
      error: error instanceof Error ? error.message : "Unknown webhook queue error"
    });
  });
}

export function generateWebhookSecret() {
  return randomBytes(32).toString("hex");
}
