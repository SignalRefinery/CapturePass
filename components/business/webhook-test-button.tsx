"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WebhookTestButtonProps = {
  organizationId: string;
  disabled?: boolean;
};

export function WebhookTestButton({ organizationId, disabled }: WebhookTestButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendTestWebhook() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/business/webhooks/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ organization_id: organizationId })
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string; skipped?: boolean; reason?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error || data?.reason || "Test webhook failed.");
        return;
      }

      setMessage(data?.message || (data?.skipped ? "Webhook skipped." : "Test webhook sent."));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send test webhook.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="table-actions">
      <button className="button secondary" type="button" disabled={disabled || loading} onClick={sendTestWebhook}>
        {loading ? "Sending..." : "Send Test Webhook"}
      </button>
      {message ? <span className="table-subtext">{message}</span> : null}
    </div>
  );
}
