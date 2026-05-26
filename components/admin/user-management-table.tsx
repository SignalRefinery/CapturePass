"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminTableFrame } from "@/components/admin/admin-table-frame";

type Row = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  slug: string | null;
  is_active: boolean | null;
  billing_exempt: boolean | null;
  is_affiliate: boolean | null;
  affiliate_tier: string | null;
  is_public_official: boolean | null;
  stripe_plan_key: string | null;
  referral_code_used?: string | null;
  referral_reconciled?: boolean | null;
  referral_reconciled_at?: string | null;
};

const cellStyle: React.CSSProperties = {
  borderRight: "1px solid #d0d5dd",
  borderBottom: "1px solid #d0d5dd",
  padding: "8px 10px",
  height: 38,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  verticalAlign: "middle",
  color: "#ffffff",
};

const headerStyle: React.CSSProperties = {
  ...cellStyle,
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "rgba(26,26,26,.8)",
  color: "#8B5CF6",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
  userSelect: "none",
};

const actionButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(139,92,246,.3)",
  background: "rgba(139,92,246,.08)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  lineHeight: 1,
  cursor: "pointer",
  textDecoration: "none",
  color: "#8B5CF6",
};

const actionCellStyle: React.CSSProperties = {
  ...cellStyle,
  borderRight: 0,
  overflow: "visible",
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "risk";
}) {
  const colorMap = {
    neutral: { background: "rgba(139,92,246,.15)", color: "#A78BFA" },
    good: { background: "rgba(34,197,94,.15)", color: "#86efac" },
    warn: { background: "rgba(250,204,21,.15)", color: "#fde047" },
    risk: { background: "rgba(239,68,68,.15)", color: "#fca5a5" },
  };

  return (
    <span
      style={{
        ...colorMap[tone],
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}

export function UserManagementTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("email");
  const [asc, setAsc] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState(rows);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = !q
      ? localRows
      : localRows.filter((r) =>
          [r.full_name, r.email, r.slug, r.stripe_plan_key, r.affiliate_tier]
            .filter(Boolean)
            .some((v) => (v as string).toLowerCase().includes(q)),
        );

    return [...base].sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }, [localRows, query, sortKey, asc]);

  function toggleSort(key: keyof Row) {
    if (sortKey === key) {
      setAsc((p) => !p);
      return;
    }

    setSortKey(key);
    setAsc(true);
  }

  async function copy(value: string | null | undefined) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  }

  async function disableUser(userId: string) {
    const confirmed = window.confirm(
      "Disable this user? This should deactivate the profile.",
    );
    if (!confirmed) return;

    setWorkingId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}/disable`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Disable request failed.");
      }

      setLocalRows((current) =>
        current.map((row) =>
          row.user_id === userId ? { ...row, is_active: false } : row,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not disable user.");
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteUser(userId: string, email: string | null) {
    const confirmed = window.confirm(
      `Permanently delete ${email || "this user"}? This removes the profile and auth account. This cannot be undone.`
    );
    if (!confirmed) return;

    const secondConfirm = window.confirm(
      "Final confirmation: permanently delete this account?"
    );
    if (!secondConfirm) return;

    setWorkingId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Delete request failed.");
      }

      setLocalRows((current) => current.filter((row) => row.user_id !== userId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete user.");
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleReferralReconciled(userId: string, currentValue: boolean | null | undefined) {
    setWorkingId(userId);

    try {
      const response = await fetch(`/api/referrals/${userId}/reconcile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reconciled: !currentValue }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Reconciliation update failed.");
      }

      const payload = await response.json().catch(() => null);

      setLocalRows((current) =>
        current.map((row) =>
          row.user_id === userId
            ? {
                ...row,
                referral_reconciled: !!payload?.referral_reconciled,
                referral_reconciled_at: payload?.referral_reconciled_at || null,
              }
            : row,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update reconciliation status.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        border: "1px solid #cbd5e1",
        boxShadow: "none",
      }}
    >
      <div
        style={{
          padding: 10,
          borderBottom: "1px solid #cbd5e1",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 10,
          alignItems: "center",
          background: "#f8fafc",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name, email, slug, plan, or tier"
          style={{
            width: "100%",
            padding: "9px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 13,
            outline: "none",
            color: "#ffffff",
          }}
        />

        <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
          {filtered.length} of {localRows.length} users
        </div>
      </div>

      <AdminTableFrame maxHeight={620}>
        <table
          style={{
            width: "100%",
            minWidth: 1540,
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
            fontSize: 13,
          }}
        >
          <colgroup>
            <col style={{ width: 170 }} />
            <col style={{ width: 230 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 105 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 420 }} />
          </colgroup>

          <thead>
            <tr>
              <th style={headerStyle} onClick={() => toggleSort("full_name")}>
                Name {sortKey === "full_name" ? (asc ? "↑" : "↓") : ""}
              </th>
              <th style={headerStyle} onClick={() => toggleSort("email")}>
                Email {sortKey === "email" ? (asc ? "↑" : "↓") : ""}
              </th>
              <th style={headerStyle} onClick={() => toggleSort("slug")}>
                Slug {sortKey === "slug" ? (asc ? "↑" : "↓") : ""}
              </th>
              <th style={headerStyle} onClick={() => toggleSort("is_active")}>
                Status {sortKey === "is_active" ? (asc ? "↑" : "↓") : ""}
              </th>
              <th
                style={headerStyle}
                onClick={() => toggleSort("stripe_plan_key")}
              >
                Plan {sortKey === "stripe_plan_key" ? (asc ? "↑" : "↓") : ""}
              </th>
              <th style={headerStyle}>Referral</th>
              <th style={headerStyle}>Flags</th>
              <th style={{ ...headerStyle, borderRight: 0 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const risk =
                (r.billing_exempt || r.is_affiliate) && r.is_public_official;

              return (
                <tr
                  key={r.user_id}
                  style={{ background: risk ? "#fffafa" : "#fff" }}
                >
                  <td style={cellStyle} title={r.full_name || ""}>
                    {r.full_name || "—"}
                  </td>

                  <td style={cellStyle} title={r.email || ""}>
                    {r.email || "—"}
                  </td>

                  <td style={cellStyle} title={r.slug ? `/${r.slug}` : ""}>
                    {r.slug ? `/${r.slug}` : "—"}
                  </td>

                  <td style={cellStyle}>
                    <Badge tone={r.is_active ? "good" : "neutral"}>
                      {r.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  <td style={cellStyle} title={r.stripe_plan_key || ""}>
                    {r.stripe_plan_key || "—"}
                  </td>

                  <td style={cellStyle} title={r.referral_code_used || ""}>
                    {r.referral_code_used ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge tone={r.referral_reconciled ? "good" : "warn"}>
                          {r.referral_reconciled ? "Reconciled" : "Unpaid"}
                        </Badge>
                        <span>{r.referral_code_used}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {r.billing_exempt ? (
                        <Badge tone="warn">Billing exempt</Badge>
                      ) : null}
                      {r.is_affiliate ? (
                        <Badge tone="neutral">
                          {r.affiliate_tier || "Affiliate"}
                        </Badge>
                      ) : null}
                      {r.is_public_official ? (
                        <Badge tone="neutral">Official</Badge>
                      ) : null}
                      {risk ? <Badge tone="risk">Risk</Badge> : null}
                      {!r.billing_exempt &&
                      !r.is_affiliate &&
                      !r.is_public_official
                        ? "—"
                        : null}
                    </div>
                  </td>

                  <td style={actionCellStyle}>
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap" }}
                    >
                      {r.slug ? (
                        <Link href={`/${r.slug}`} style={actionButtonStyle}>
                          View
                        </Link>
                      ) : null}

                      <Link
                        href={`/admin/account/${r.user_id}`}
                        style={actionButtonStyle}
                      >
                        Manage
                      </Link>

                      <button
                        type="button"
                        onClick={() => copy(r.email)}
                        style={actionButtonStyle}
                      >
                        Copy email
                      </button>

                      {r.referral_code_used ? (
                        <button
                          type="button"
                          disabled={workingId === r.user_id}
                          onClick={() => toggleReferralReconciled(r.user_id, r.referral_reconciled)}
                          style={{
                            ...actionButtonStyle,
                            borderColor: r.referral_reconciled ? "rgba(34,197,94,.4)" : "rgba(250,204,21,.4)",
                            background: r.referral_reconciled ? "rgba(34,197,94,.1)" : "rgba(250,204,21,.1)",
                            color: r.referral_reconciled ? "#86efac" : "#fde047",
                            opacity: workingId === r.user_id ? 0.55 : 1,
                          }}
                        >
                          {r.referral_reconciled ? "Mark unpaid" : "Mark reconciled"}
                        </button>
                      ) : null}

                      {r.is_active ? (
                        <button
                          type="button"
                          disabled={workingId === r.user_id}
                          onClick={() => disableUser(r.user_id)}
                          style={{
                            ...actionButtonStyle,
                            borderColor: "rgba(239,68,68,.4)",
                            background: "rgba(239,68,68,.1)",
                            color: "#fca5a5",
                            opacity: workingId === r.user_id ? 0.55 : 1,
                          }}
                        >
                          {workingId === r.user_id ? "Disabling…" : "Disable"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={workingId === r.user_id}
                        onClick={() => deleteUser(r.user_id, r.email)}
                        style={{
                          ...actionButtonStyle,
                          borderColor: "rgba(239,68,68,.4)",
                          background: "rgba(239,68,68,.1)",
                          color: "#fca5a5",
                          opacity: workingId === r.user_id ? 0.55 : 1,
                        }}
                      >
                        {workingId === r.user_id ? "Working…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...cellStyle, textAlign: "center" }}>
                  No users match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </AdminTableFrame>
    </div>
  );
}
