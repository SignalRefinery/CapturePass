import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import { SlugReviewQueue } from "@/components/admin/slug-review-queue";
import { UserManagementTable } from "@/components/admin/user-management-table";
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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  const { data: partnerRequests } = await supabase
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
    const liveSlugState = classifySlug(row.slug || "").state;
    const requestedSlugState = classifySlug(row.slug_requested || "").state;
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

              <div style={{ overflowX: "auto" }}>
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
              </div>
            </div>
          ) : null}

          {affiliates.length > 0 ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="dashboard-kicker">Affiliates</div>
              <h2 className="section-title" style={{ fontSize: 22 }}>
                Affiliate overview
              </h2>
              <p className="editor-copy">
                Track referral codes, signups, and reconciliation status for each affiliate.
              </p>

              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Code</th>
                      <th>Signups</th>
                      <th>Reconciled</th>
                      <th>Unpaid</th>
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
                        <tr key={`affiliate-${affiliate.user_id}`}>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <details style={{ padding: "12px 14px" }}>
                              <summary
                                style={{
                                  cursor: "pointer",
                                  display: "grid",
                                  gridTemplateColumns: "1.2fr 1.3fr .9fr .65fr .8fr .65fr",
                                  gap: 12,
                                  alignItems: "center"
                                }}
                              >
                                <span>{affiliate.full_name || "—"}</span>
                                <span>{affiliate.email || "—"}</span>
                                <span>{affiliate.referral_code || "—"}</span>
                                <span>{referred.length}</span>
                                <span>{reconciled.length}</span>
                                <span>{unpaid}</span>
                              </summary>

                              <div style={{ marginTop: 14, overflowX: "auto" }}>
                                {referred.length > 0 ? (
                                  <table className="admin-table">
                                    <thead>
                                      <tr>
                                        <th>Referred user</th>
                                        <th>Email</th>
                                        <th>Plan</th>
                                        <th>Status</th>
                                        <th>Reconciliation</th>
                                        <th>Manage</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {referred.map((referredUser) => (
                                        <tr key={`referred-${affiliate.user_id}-${referredUser.user_id}`}>
                                          <td>{referredUser.full_name || "—"}</td>
                                          <td>{referredUser.email || "—"}</td>
                                          <td>{referredUser.stripe_plan_key || "—"}</td>
                                          <td>{referredUser.is_active ? "Active" : "Inactive"}</td>
                                          <td>
                                            {referredUser.referral_reconciled ? "Reconciled" : "Unpaid"}
                                            {referredUser.referral_reconciled_at
                                              ? ` · ${new Date(referredUser.referral_reconciled_at).toLocaleDateString()}`
                                              : ""}
                                          </td>
                                          <td>
                                            <Link
                                              className="button secondary"
                                              href={`/admin/account/${referredUser.user_id}`}
                                            >
                                              Manage
                                            </Link>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="editor-copy" style={{ margin: 0 }}>
                                    No referred users yet.
                                  </p>
                                )}
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

              <div style={{ overflowX: "auto" }}>
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
              </div>
            </div>
          ) : null}

          {riskCases.length > 0 ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="dashboard-kicker">Compliance alerts</div>
              <h2 className="section-title" style={{ fontSize: 22 }}>
                Public-official risk cases
              </h2>

              <div style={{ overflowX: "auto" }}>
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
              </div>
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