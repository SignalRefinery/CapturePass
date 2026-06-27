"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PendingSlugRow = {
  user_id: string;
  full_name: string;
  email: string;
  slug: string;
  slug_requested: string | null;
  slug_review_reason: string | null;
};

export function SlugReviewQueue({ rows }: { rows: PendingSlugRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(row: PendingSlugRow, action: "approve" | "deny") {
    const profileLabel = row.full_name || row.email || row.user_id;
    const confirmed = window.confirm(
      [
        action === "approve" ? "Approve this slug request?" : "Deny this slug request?",
        "",
        `Profile: ${profileLabel}`,
        `Current slug: ${row.slug || "not set"}`,
        `Requested slug: ${row.slug_requested || "none"}`,
        `Review reason: ${row.slug_review_reason || "title review"}`,
        "",
        action === "approve"
          ? "Approving will replace the current public slug."
          : "Denying will clear the pending request and mark it rejected."
      ].join("\n")
    );

    if (!confirmed) return;

    const userId = row.user_id;
    setBusyId(userId + action);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/slug-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, action })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to process slug review.");
        return;
      }

      setMessage(data.message || `Slug request ${action === "approve" ? "approved" : "denied"}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process slug review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-kicker">Slug moderation</div>
      <h2>Pending slug review queue</h2>
      {error ? <p className="auth-error" style={{ marginTop: 10 }}>{error}</p> : null}
      {message ? <p className="auth-message" style={{ marginTop: 10 }}>{message}</p> : null}
      {rows.length === 0 ? (
        <p className="editor-copy">No slug requests are waiting for review.</p>
      ) : (
        <div className="status-list">
          {rows.map((row) => (
            <div className="status-row" key={row.user_id}>
              <span>
                <strong>{row.full_name || row.email}</strong>
                <br />
                Current: {row.slug}
                <br />
                Requested: {row.slug_requested}
                <br />
                <small style={{ opacity: 0.7 }}>{row.slug_review_reason || "title review"}</small>
              </span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => submit(row, "approve")}
                  disabled={!!busyId}
                >
                  {busyId === row.user_id + "approve" ? "Approving..." : "Approve"}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => submit(row, "deny")}
                  disabled={!!busyId}
                >
                  {busyId === row.user_id + "deny" ? "Denying..." : "Deny"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
