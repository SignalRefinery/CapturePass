import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SlugReviewQueue } from "@/components/admin/slug-review-queue";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { AdminTableFrame } from "@/components/admin/admin-table-frame";
import { classifySlug } from "@/lib/slug-moderation";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

async function getInitialAuth() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    email: user.email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  const initialAuth = await getInitialAuth();
  const myProfileHref = initialAuth?.slug ? `/${initialAuth.slug}` : null;
  const admin = createAdminClient();

  // Admin operational tables include inactive and pending-review profiles that
  // normal user RLS intentionally hides from browser/session clients.
  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  const { data: partnerRequests } = await admin
    .from("partner_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = profiles || [];
  const requestRows = partnerRequests || [];

  const affiliates = rows.filter((row) => row.is_affiliate);
  const active = rows.filter((row) => row.is_active);
  const pendingSlugRows = rows.filter(
    (row) => row.slug_status === "pending_review" && row.slug_requested
  );
  const blockedSlugCases = rows.filter((row) => {
    const liveSlug = (row.slug || "").trim();
    const requestedSlug = (row.slug_requested || "").trim();

    const liveSlugState = liveSlug ? classifySlug(liveSlug).state : "ok";
    const requestedSlugState = requestedSlug ? classifySlug(requestedSlug).state : "ok";

    return liveSlugState === "blocked" || requestedSlugState === "blocked";
  });
  const riskCases = rows.filter(
    (row) => row.is_public_official && (row.is_affiliate || row.billing_exempt)
  );

  return (
    <Shell
      footerLeft="Admin"
      footerRight="Signal Pass"
      myProfileHref={myProfileHref}
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pricing", label: "Pricing" }
      ]}
    >
      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <div className="dashboard-kicker">Admin console</div>
            <h1 className="section-title" style={{ marginTop: 6 }}>
              User operations
            </h1>
            <p className="editor-copy" style={{ maxWidth: 760 }}>
              Spreadsheet-style account review, slug approvals, billing flags,
              affiliate status, and operational exceptions.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 12
            }}
          >
            <div className="card" style={{ padding: 16 }}>
              <div className="label">Total users</div>
              <strong style={{ fontSize: 28 }}>{rows.length}</strong>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="label">Active</div>
              <strong style={{ fontSize: 28 }}>{active.length}</strong>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="label">Affiliates</div>
              <strong style={{ fontSize: 28 }}>{affiliates.length}</strong>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="label">Pending slugs</div>
              <strong style={{ fontSize: 28 }}>{pendingSlugRows.length}</strong>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="label">Blocked slugs</div>
              <strong style={{ fontSize: 28 }}>{blockedSlugCases.length}</strong>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="label">Risk flags</div>
              <strong style={{ fontSize: 28 }}>{riskCases.length}</strong>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="label">Partner requests</div>
              <strong style={{ fontSize: 28 }}>{requestRows.length}</strong>
            </div>
          </div>
          {requestRows.length > 0 ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="dashboard-kicker">Partner intake</div>
              <h2 className="section-title" style={{ fontSize: 22 }}>
                Partner requests
              </h2>
              <p className="editor-copy">
                Review inbound partner requests, then approve qualified people from the user detail page by assigning affiliate status and a referral code.
              </p>

              <AdminTableFrame>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Organization</th>
                      <th>Role</th>
                      <th>Network</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestRows.map((request) => (
                      <tr key={request.id}>
                        <td>{request.name || "—"}</td>
                        <td>{request.email || "—"}</td>
                        <td>{request.organization || "—"}</td>
                        <td>{request.role || "—"}</td>
                        <td>{request.network || "—"}</td>
                        <td>{request.status || "new"}</td>
                        <td>
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableFrame>
            </div>
          ) : null}

          {affiliates.length > 0 ? (
            <div
              className="card"
              style={{
                padding: 0,
                overflow: "hidden",
                background: "#f8fafc",
                color: "#0f172a",
                border: "1px solid #cbd5e1"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  borderBottom: "1px solid #cbd5e1"
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                      color: "#64748b",
                      fontWeight: 800
                    }}
                  >
                    Affiliates
                  </div>
                  <h2
                    style={{
                      margin: "6px 0 0",
                      fontSize: 24,
                      lineHeight: 1.1,
                      color: "#0f172a"
                    }}
                  >
                    Affiliate spreadsheet
                  </h2>
                </div>
                <div style={{ color: "#475569", fontWeight: 700 }}>
                  {affiliates.length} affiliate{affiliates.length === 1 ? "" : "s"}
                </div>
              </div>

              <AdminTableFrame>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 980,
                    fontSize: 15
                  }}
                >
                  <thead>
                    <tr style={{ background: "#e2e8f0" }}>
                      <th style={{ padding: "14px 16px", textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Name</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Email</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Code</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Signups</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Reconciled</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Unpaid</th>
                      <th style={{ padding: "14px 16px", textAlign: "left" }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((affiliate) => {
                      const referred = rows.filter(
                        (r) => r.referral_code_used && r.referral_code_used === affiliate.referral_code
                      );

                      const reconciled = referred.filter((r) => r.referral_reconciled);
                      const unpaid = referred.length - reconciled.length;

                      return (
                        <tr key={`affiliate-${affiliate.user_id}`} style={{ borderTop: "1px solid #cbd5e1" }}>
                          <td style={{ padding: "14px 16px", borderRight: "1px solid #cbd5e1" }}>{affiliate.full_name || "—"}</td>
                          <td style={{ padding: "14px 16px", borderRight: "1px solid #cbd5e1" }}>{affiliate.email || "—"}</td>
                          <td style={{ padding: "14px 16px", borderRight: "1px solid #cbd5e1", fontFamily: "monospace" }}>{affiliate.referral_code || "—"}</td>
                          <td style={{ padding: "14px 16px", borderRight: "1px solid #cbd5e1" }}>{referred.length}</td>
                          <td style={{ padding: "14px 16px", borderRight: "1px solid #cbd5e1" }}>{reconciled.length}</td>
                          <td style={{ padding: "14px 16px", borderRight: "1px solid #cbd5e1", fontWeight: 800, color: unpaid > 0 ? "#92400e" : "#166534" }}>{unpaid}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <details>
                              <summary style={{ cursor: "pointer", fontWeight: 800, color: "#1d4ed8" }}>
                                View users
                              </summary>

                              <AdminTableFrame style={{ marginTop: 12 }}>
                                {referred.length > 0 ? (
                                  <table
                                    style={{
                                      width: "100%",
                                      borderCollapse: "collapse",
                                      minWidth: 760,
                                      background: "#ffffff",
                                      border: "1px solid #cbd5e1"
                                    }}
                                  >
                                    <thead>
                                      <tr style={{ background: "#f1f5f9" }}>
                                        <th style={{ padding: 10, textAlign: "left", borderRight: "1px solid #cbd5e1" }}>User</th>
                                        <th style={{ padding: 10, textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Email</th>
                                        <th style={{ padding: 10, textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Plan</th>
                                        <th style={{ padding: 10, textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Status</th>
                                        <th style={{ padding: 10, textAlign: "left", borderRight: "1px solid #cbd5e1" }}>Referral</th>
                                        <th style={{ padding: 10, textAlign: "left" }}>Manage</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {referred.map((referredUser) => (
                                        <tr key={`referred-${affiliate.user_id}-${referredUser.user_id}`} style={{ borderTop: "1px solid #e2e8f0" }}>
                                          <td style={{ padding: 10, borderRight: "1px solid #e2e8f0" }}>{referredUser.full_name || "—"}</td>
                                          <td style={{ padding: 10, borderRight: "1px solid #e2e8f0" }}>{referredUser.email || "—"}</td>
                                          <td style={{ padding: 10, borderRight: "1px solid #e2e8f0" }}>{referredUser.stripe_plan_key || "—"}</td>
                                          <td style={{ padding: 10, borderRight: "1px solid #e2e8f0" }}>{referredUser.is_active ? "Active" : "Inactive"}</td>
                                          <td style={{ padding: 10, borderRight: "1px solid #e2e8f0" }}>
                                            {referredUser.referral_reconciled ? "Reconciled" : "Unpaid"}
                                            {referredUser.referral_reconciled_at
                                              ? ` · ${new Date(referredUser.referral_reconciled_at).toLocaleDateString()}`
                                              : ""}
                                          </td>
                                          <td style={{ padding: 10 }}>
                                            <Link
                                              href={`/admin/account/${referredUser.user_id}`}
                                              style={{ color: "#1d4ed8", fontWeight: 800 }}
                                            >
                                              Manage
                                            </Link>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p style={{ margin: 0, color: "#64748b" }}>No referred users yet.</p>
                                )}
                              </AdminTableFrame>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </AdminTableFrame>
            </div>
          ) : null}

          {pendingSlugRows.length > 0 ? (
            <SlugReviewQueue rows={pendingSlugRows} />
          ) : null}

          {blockedSlugCases.length > 0 ? (
            <div className="card" style={{ padding: 18, borderColor: "#7f1d1d" }}>
              <div className="dashboard-kicker">Immediate action needed</div>
              <h2 className="section-title" style={{ fontSize: 22 }}>
                Blocked slug accounts
              </h2>
              <p className="editor-copy">
                These accounts contain a blocked live or requested slug. Review and delete,
                disable, or replace the slug before allowing the account to remain active.
              </p>

              <AdminTableFrame>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Live slug</th>
                      <th>Requested slug</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedSlugCases.map((row) => (
                      <tr key={`blocked-${row.user_id}`}>
                        <td>{row.full_name || "—"}</td>
                        <td>{row.email || "—"}</td>
                        <td>{row.slug || "—"}</td>
                        <td>{row.slug_requested || "—"}</td>
                        <td>
                          <Link className="button secondary" href={`/admin/account/${row.user_id}`}>
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableFrame>
            </div>
          ) : null}

          {riskCases.length > 0 ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="dashboard-kicker">Compliance alerts</div>
              <h2 className="section-title" style={{ fontSize: 22 }}>
                Public-official risk cases
              </h2>

              <AdminTableFrame>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Slug</th>
                      <th>Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskCases.map((row) => (
                      <tr key={`risk-${row.user_id}`}>
                        <td>{row.full_name || "—"}</td>
                        <td>{row.email || "—"}</td>
                        <td>{row.slug || "—"}</td>
                        <td>
                          {row.billing_exempt ? "Billing exempt" : ""}
                          {row.billing_exempt && row.is_affiliate ? " · " : ""}
                          {row.is_affiliate
                            ? `Affiliate (${row.affiliate_tier || "standard"})`
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableFrame>
            </div>
          ) : null}

          <UserManagementTable
            rows={rows.map((row) => ({
              user_id: row.user_id,
              full_name: row.full_name,
              email: row.email,
              slug: row.slug,
              is_active: row.is_active,
              billing_exempt: row.billing_exempt,
              is_affiliate: row.is_affiliate,
              affiliate_tier: row.affiliate_tier,
              is_public_official: row.is_public_official,
              stripe_plan_key: row.stripe_plan_key,
              referral_code_used: row.referral_code_used,
              referral_reconciled: row.referral_reconciled,
              referral_reconciled_at: row.referral_reconciled_at
            }))}
          />
        </div>
      </section>
    </Shell>
  );
}
