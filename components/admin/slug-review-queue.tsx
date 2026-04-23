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

  async function submit(userId: string, action: "approve" | "deny") {
    setBusyId(userId + action);

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
        alert(data.error || "Unable to process slug review.");
        return;
      }

      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-kicker">Slug moderation</div>
      <h2>Pending slug review queue</h2>
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
                  onClick={() => submit(row.user_id, "approve")}
                  disabled={busyId === row.user_id + "approve"}
                >
                  {busyId === row.user_id + "approve" ? "Approving..." : "Approve"}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => submit(row.user_id, "deny")}
                  disabled={busyId === row.user_id + "deny"}
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
