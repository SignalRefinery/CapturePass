import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import { AffiliateTerms } from "@/components/legal/affiliate-terms";
import { SlugReviewQueue } from "@/components/admin/slug-review-queue";
import { UserManagementTable } from "@/components/admin/user-management-table";

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
    .limit(100);

  const rows = profiles || [];
  const founders = rows.filter((row) => row.affiliate_tier === "founder");
  const affiliates = rows.filter((row) => row.is_affiliate);
  const riskCases = rows.filter(
    (row) => row.is_public_official && (row.is_affiliate || row.billing_exempt)
  );
  const pendingSlugRows = rows.filter(
    (row) => row.slug_status === "pending_review" && row.slug_requested
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
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Admin</span>
        </div>
        <h1>Operations and compliance.</h1>
        <p>
          Founders, affiliates, slug requests, and direct account controls in one working console.
        </p>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Overview</div>
            <h2>System totals</h2>
            <div className="status-list">
              <div className="status-row">
                <span>Total profiles</span>
                <strong>{rows.length}</strong>
              </div>
              <div className="status-row">
                <span>Affiliates</span>
                <strong>{affiliates.length}</strong>
              </div>
              <div className="status-row">
                <span>Founders</span>
                <strong>{founders.length}</strong>
              </div>
              <div className="status-row">
                <span>Risk cases</span>
                <strong>{riskCases.length}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-kicker">Recent activity</div>
            <h2>Founder and affiliate creation</h2>
            <div className="status-list">
              {founders.slice(0, 5).map((row) => (
                <div className="status-row" key={`founder-${row.user_id}`}>
                  <span>Founder created</span>
                  <strong>{row.full_name || row.email}</strong>
                </div>
              ))}

              {affiliates
                .filter((row) => row.affiliate_tier !== "founder")
                .slice(0, 5)
                .map((row) => (
                  <div className="status-row" key={`affiliate-${row.user_id}`}>
                    <span>Affiliate created</span>
                    <strong>{row.full_name || row.email}</strong>
                  </div>
                ))}

              {founders.length === 0 && affiliates.length === 0 ? (
                <p className="editor-copy">
                  No founder or affiliate activity has been recorded yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <SlugReviewQueue rows={pendingSlugRows} />
        </div>

        {riskCases.length > 0 ? (
          <div className="dashboard-card" style={{ marginTop: 18 }}>
            <div className="dashboard-kicker">Compliance alerts</div>
            <h2>Public-official risk cases</h2>
            <div className="status-list">
              {riskCases.map((row) => (
                <div className="status-row" key={`risk-${row.user_id}`}>
                  <span>{row.full_name || row.email}</span>
                  <strong>
                    {row.billing_exempt ? "Billing exempt" : ""}
                    {row.billing_exempt && row.is_affiliate ? " · " : ""}
                    {row.is_affiliate ? `Affiliate (${row.affiliate_tier || "standard"})` : ""}
                  </strong>
                </div>
              ))}
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
            stripe_plan_key: row.stripe_plan_key
          }))}
        />

        <div className="status-bottom" style={{ marginTop: 18 }}>
          <AffiliateTerms />
        </div>
      </section>
    </Shell>
  );
}
