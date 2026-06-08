import { CopyLinkButton } from "@/components/business/copy-link-button";
import { WebhookTestButton } from "@/components/business/webhook-test-button";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import {
  regenerateOrganizationWebhookSecret,
  saveOrganizationWebhooks
} from "@/app/dashboard/business/actions";
import type { OrganizationWebhookRecord, WebhookDeliveryRecord } from "@/lib/types";

type BusinessAutomationsSectionProps = {
  organizationId: string;
  webhookSettings: OrganizationWebhookRecord | null;
  webhookDeliveries: WebhookDeliveryRecord[];
};

export function BusinessAutomationsSection({
  organizationId,
  webhookSettings,
  webhookDeliveries
}: BusinessAutomationsSectionProps) {
  return (
    <section className="dashboard-wrap" id="business-automations">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Automations</div>
        <h2>Send TapTagg events to your workflows.</h2>
        <p className="editor-copy">
          Connect TapTagg Business to Zapier, Make, HubSpot workflows, Salesforce workflows, GoHighLevel, custom CRMs, or any system that accepts webhooks.
        </p>

        <form action={saveOrganizationWebhooks} className="editor-form" style={{ marginTop: 18 }}>
          <input type="hidden" name="organization_id" value={organizationId} />
          <label className="editor-label">
            <span style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span>Enable Webhooks</span>
              <input
                name="enabled"
                type="checkbox"
                defaultChecked={webhookSettings?.enabled ?? false}
                aria-label="Enable webhooks"
              />
            </span>
          </label>
          <label className="editor-label">
            Webhook URL
            <input
              className="editor-input"
              name="webhook_url"
              placeholder="https://example.com/webhooks/taptagg"
              defaultValue={webhookSettings?.webhook_url || ""}
            />
          </label>
          <button className="button primary" type="submit">
            Save Webhook Settings
          </button>
        </form>

        <form action={regenerateOrganizationWebhookSecret} className="table-actions" style={{ marginTop: 12 }}>
          <input type="hidden" name="organization_id" value={organizationId} />
          <ConfirmSubmitButton
            className="button secondary"
            confirmMessage="Regenerate the webhook secret? Existing integrations will need the updated secret."
          >
            Regenerate Secret
          </ConfirmSubmitButton>
        </form>

        <div className="dashboard-card" style={{ marginTop: 18 }}>
          <div className="dashboard-kicker">Webhook Secret</div>
          {webhookSettings?.webhook_secret ? (
            <div className="table-actions">
              <code style={{ wordBreak: "break-all" }}>{webhookSettings.webhook_secret}</code>
              <CopyLinkButton
                className="button secondary"
                value={webhookSettings.webhook_secret}
                label="Copy Secret"
                copiedLabel="Secret Copied"
              />
            </div>
          ) : (
            <p className="editor-copy">Save or regenerate settings to create a webhook secret.</p>
          )}
          <p className="table-subtext">
            Signature format: HMAC_SHA256(secret, timestamp + &quot;.&quot; + raw_json_payload)
          </p>
          <WebhookTestButton
            organizationId={organizationId}
            disabled={!webhookSettings?.enabled}
          />
        </div>

        <div className="admin-table-frame business-member-table" style={{ marginTop: 18 }}>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Success</th>
                  <th>Status Code</th>
                </tr>
              </thead>
              <tbody>
                {webhookDeliveries.length > 0 ? (
                  webhookDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{delivery.attempted_at ? new Date(delivery.attempted_at).toLocaleString() : "—"}</td>
                      <td>{delivery.event_type}</td>
                      <td>
                        <span className="status-pill">{delivery.success ? "true" : "false"}</span>
                      </td>
                      <td>{delivery.status_code ?? "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <p className="editor-copy">No webhook deliveries yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
