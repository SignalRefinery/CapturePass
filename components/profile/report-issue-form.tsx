"use client";

import { useState } from "react";

type ReportIssueFormProps = {
  profileId?: string;
  slug: string;
};

export function ReportIssueForm({ profileId, slug }: ReportIssueFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReport() {
    if (!reason.trim()) {
      setMessage("Please add a reason before submitting.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profileId,
          slug,
          reason: reason.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Unable to submit report.");
        return;
      }

      setReason("");
      setOpen(false);
      setMessage("Report sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <button
        className="button text"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Report an issue with this profile
      </button>

      {open ? (
        <div className="auth-field" style={{ marginTop: 12 }}>
          <span>Reason</span>
          <textarea
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe the issue with this profile."
          />
          <div className="editor-actions">
            <button
              className="button primary"
              type="button"
              onClick={submitReport}
              disabled={busy}
            >
              {busy ? "Sending..." : "Submit report"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="auth-message" style={{ marginTop: 10 }}>{message}</p> : null}
    </div>
  );
}
