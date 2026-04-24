"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
};

export function UserManagementTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("email");
  const [asc, setAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = !q
      ? rows
      : rows.filter((r) =>
          [r.full_name, r.email, r.slug]
            .filter(Boolean)
            .some((v) => (v as string).toLowerCase().includes(q))
        );

    const sorted = [...base].sort((a, b) => {
      const av = (a[sortKey] ?? "") as any;
      const bv = (b[sortKey] ?? "") as any;
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [rows, query, sortKey, asc]);

  function toggleSort(key: keyof Row) {
    if (sortKey === key) setAsc((p) => !p);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: 14, borderBottom: "1px solid #eee", display: "flex", gap: 10 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, slug…"
          style={{ flex: 1, padding: 8, border: "1px solid #ddd" }}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th onClick={() => toggleSort("full_name")}>Name</th>
              <th onClick={() => toggleSort("email")}>Email</th>
              <th onClick={() => toggleSort("slug")}>Slug</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user_id}>
                <td>{r.full_name || "—"}</td>
                <td>{r.email || "—"}</td>
                <td>{r.slug ? `/${r.slug}` : "—"}</td>
                <td>{r.is_active ? "Active" : "Inactive"}</td>
                <td>{r.stripe_plan_key || "—"}</td>
                <td>
                  {r.billing_exempt ? "Billing exempt" : ""}
                  {r.billing_exempt && r.is_affiliate ? " · " : ""}
                  {r.is_affiliate ? `Affiliate (${r.affiliate_tier || "standard"})` : ""}
                  {(r.billing_exempt || r.is_affiliate) && r.is_public_official ? " · Risk" : ""}
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  {r.slug && (
                    <Link href={`/${r.slug}`} className="button secondary">
                      View
                    </Link>
                  )}
                  <Link href={`/admin/users/${r.user_id}`} className="button secondary">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 16, textAlign: "center" }}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
