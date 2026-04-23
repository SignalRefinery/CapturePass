import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";

async function getAccountData() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug, stripe_customer_id, stripe_plan_key, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    email: user.email,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null,
    customerId: profile?.stripe_customer_id || null,
    plan: profile?.stripe_plan_key || "Not set",
    createdAt: profile?.created_at || null
  };
}

export default async function AccountPage() {
  const account = await getAccountData();

  return (
    <Shell
      footerLeft="Account"
      footerRight="Signal Pass"
      initialAuth={
        account
          ? {
              email: account.email,
              fullName: account.fullName,
              slug: account.slug
            }
          : null
      }
      navLinks={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pricing", label: "Pricing" }
      ]}
    >
      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          
          {/* ACCOUNT OVERVIEW */}
          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Account</h2>

            <div className="account-grid">
              <div>
                <span className="label">Email</span>
                <div>{account?.email}</div>
              </div>

              <div>
                <span className="label">Name</span>
                <div>{account?.fullName || "—"}</div>
              </div>

              <div>
                <span className="label">Member since</span>
                <div>
                  {account?.createdAt
                    ? new Date(account.createdAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* PLAN */}
          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Plan</h2>

            <div className="account-grid">
              <div>
                <span className="label">Current plan</span>
                <div>{account?.plan}</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              {account?.customerId ? (
                <form action="/api/portal" method="post">
                  <button className="button primary">
                    Manage plan
                  </button>
                </form>
              ) : (
                <a href="/pricing" className="button primary">
                  Choose plan
                </a>
              )}
            </div>
          </div>

          {/* PROFILE */}
          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Profile</h2>

            <div className="account-grid">
              <div>
                <span className="label">Profile URL</span>
                <div>
                  {account?.slug
                    ? `/${account.slug}`
                    : "Not issued yet"}
                </div>
              </div>
            </div>

            {account?.slug && (
              <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                <a href={`/${account.slug}`} className="button secondary">
                  View profile
                </a>

                <a href="/dashboard" className="button secondary">
                  Edit profile
                </a>
              </div>
            )}
          </div>

        </div>
      </section>
    </Shell>
  );
}