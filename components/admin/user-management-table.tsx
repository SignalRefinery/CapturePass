"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { classifySlug } from "@/lib/slug-moderation";

type Row = {
  user_id: string;
  full_name: string;
  email: string;
  slug: string;
  is_active?: boolean;
  billing_exempt?: boolean;
  is_affiliate?: boolean;
  affiliate_tier?: string | null;
  is_public_official?: boolean;
  stripe_plan_key?: string | null;
};

export function UserManagementTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Row>>(
    Object.fromEntries(rows.map((row) => [row.user_id, row]))
  );

  function updateDraft(userId: string, patch: Partial<Row>) {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch
      }
    }));
  }

  async function saveUser(userId: string) {
    const draft = drafts[userId];
    const moderation = classifySlug(draft.slug || "");

    if (moderation.state === "blocked") {
      alert(moderation.reason || "That slug is blocked and cannot be used.");
      return;
    }

    let overrideRestrictedSlug = false;

    if (moderation.state === "review") {
      overrideRestrictedSlug = window.confirm(
        `${moderation.reason}\n\nApprove this restricted slug anyway from admin?`
      );

      if (!overrideRestrictedSlug) {
        return;
      }
    }

    setBusy(`save-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: draft.full_name,
          email: draft.email,
          slug: draft.slug,
          is_active: !!draft.is_active,
          billing_exempt: !!draft.billing_exempt,
          is_affiliate: !!draft.is_affiliate,
          affiliate_tier: draft.affiliate_tier || null,
          is_public_official: !!draft.is_public_official,
          stripe_plan_key: draft.stripe_plan_key || null,
          overrideRestrictedSlug
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to save user.");
        return;
      }

      setEditingId(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function disableUser(userId: string, email: string) {
    const confirmed = window.confirm(
      `Disable ${email}? The public profile will stop resolving immediately until it is re-enabled.`
    );

    if (!confirmed) return;

    setBusy(`disable-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}/disable`, {
        method: "POST"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to disable user.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function enableUser(userId: string) {
    setBusy(`enable-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}/disable`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to re-enable user.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(userId: string, email: string) {
    const confirmed = window.confirm(
      `Delete ${email}? This removes the auth account and profile record.`
    );

    if (!confirmed) return;

    setBusy(`delete-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to delete user.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="dashboard-card" style={{ marginTop: 18 }}>
      <div className="dashboard-kicker">User management</div>
      <h2>Live controls</h2>
      <p className="editor-copy">
        Edit core user fields, instantly disable live profiles, re-enable them when needed, and remove test accounts entirely.
      </p>

      <div className="status-list">
        {rows.map((row) => {
          const draft = drafts[row.user_id];
          const editing = editingId === row.user_id;
          const moderation = classifySlug(draft?.slug || row.slug || "");
          const moderationText =
            moderation.state === "blocked"
              ? moderation.reason
              : moderation.state === "review"
              ? `${moderation.reason} Admin override required to save it directly.`
              : "Slug allowed.";

          return (
            <div key={row.user_id} className="card" style={{ padding: 18 }}>
              {editing ? (
                <div className="editor-form">
                  <div className="editor-grid">
                    <label className="auth-field">
                      <span>Full name</span>
                      <input
                        value={draft.full_name || ""}
                        onChange={(event) => updateDraft(row.user_id, { full_name: event.target.value })}
                      />
                    </label>

                    <label className="auth-field">
                      <span>Email</span>
                      <input
                        value={draft.email || ""}
                        onChange={(event) => updateDraft(row.user_id, { email: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="editor-grid">
                    <label className="auth-field">
                      <span>Slug</span>
                      <input
                        value={draft.slug || ""}
                        onChange={(event) => updateDraft(row.user_id, { slug: event.target.value })}
                      />
                      <small className={moderation.state === "blocked" ? "auth-error" : "auth-message"}>
                        {moderationText}
                      </small>
                    </label>

                    <label className="auth-field">
                      <span>Plan key</span>
                      <input
                        value={draft.stripe_plan_key || ""}
                        onChange={(event) => updateDraft(row.user_id, { stripe_plan_key: event.target.value })}
                        placeholder="essential / professional / premium"
                      />
                    </label>
                  </div>

                  <div className="editor-grid">
                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        checked={!!draft.is_active}
                        onChange={(event) => updateDraft(row.user_id, { is_active: event.target.checked })}
                      />
                      <span>Active</span>
                    </label>

                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        checked={!!draft.billing_exempt}
                        onChange={(event) => updateDraft(row.user_id, { billing_exempt: event.target.checked })}
                      />
                      <span>Billing exempt</span>
                    </label>
                  </div>

                  <div className="editor-grid">
                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        checked={!!draft.is_affiliate}
                        onChange={(event) => updateDraft(row.user_id, { is_affiliate: event.target.checked })}
                      />
                      <span>Affiliate</span>
                    </label>

                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        checked={!!draft.is_public_official}
                        onChange={(event) => updateDraft(row.user_id, { is_public_official: event.target.checked })}
                      />
                      <span>Public official flag</span>
                    </label>
                  </div>

                  <label className="auth-field">
                    <span>Affiliate tier</span>
                    <input
                      value={draft.affiliate_tier || ""}
                      onChange={(event) => updateDraft(row.user_id, { affiliate_tier: event.target.value })}
                      placeholder="founder / standard"
                    />
                  </label>

                  <div className="editor-actions">
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => saveUser(row.user_id)}
                      disabled={busy === `save-${row.user_id}`}
                    >
                      {busy === `save-${row.user_id}` ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        updateDraft(row.user_id, row);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="status-list" style={{ marginTop: 0 }}>
                  <div className="status-row">
                    <span>
                      <strong>{row.full_name || row.email}</strong>
                      <br />
                      <small style={{ opacity: 0.7 }}>{row.email}</small>
                      <br />
                      <small style={{ opacity: 0.7 }}>{row.slug}</small>
                    </span>
                    <strong>
                      {row.billing_exempt ? "Billing exempt" : row.is_active ? "Active" : "Disabled"}
                      {row.is_affiliate ? ` · ${row.affiliate_tier || "affiliate"}` : ""}
                    </strong>
                  </div>

                  <div className="editor-actions">
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setEditingId(row.user_id)}
                    >
                      Edit user
                    </button>

                    {row.is_active ? (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => disableUser(row.user_id, row.email)}
                        disabled={busy === `disable-${row.user_id}`}
                      >
                        {busy === `disable-${row.user_id}` ? "Disabling..." : "Disable profile"}
                      </button>
                    ) : (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => enableUser(row.user_id)}
                        disabled={busy === `enable-${row.user_id}`}
                      >
                        {busy === `enable-${row.user_id}` ? "Re-enabling..." : "Re-enable profile"}
                      </button>
                    )}

                    <button
                      className="button text"
                      type="button"
                      onClick={() => deleteUser(row.user_id, row.email)}
                      disabled={busy === `delete-${row.user_id}`}
                    >
                      {busy === `delete-${row.user_id}` ? "Deleting..." : "Delete user"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
