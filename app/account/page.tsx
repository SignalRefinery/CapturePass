import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";

function cleanValue(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function getAccountData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  const metaFullName =
    cleanValue(typeof meta.full_name === "string" ? meta.full_name : null) ||
    cleanValue(
      `${typeof meta.first_name === "string" ? meta.first_name : ""} ${
        typeof meta.last_name === "string" ? meta.last_name : ""
      }`,
    );

  const metaSlug = cleanValue(
    typeof meta.suggested_slug === "string" ? meta.suggested_slug : null,
  );

  const metaPromo = cleanValue(
    typeof meta.promo_code === "string" ? meta.promo_code.toUpperCase() : null,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email, full_name, slug, stripe_customer_id, stripe_subscription_id, stripe_plan_key, subscription_status, created_at, lifetime_free, billing_exempt, promo_code_used",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const email = cleanValue(profile?.email) || user.email || null;
  const fullName = cleanValue(profile?.full_name) || metaFullName;
  const slug = cleanValue(profile?.slug) || metaSlug;
  const promoCodeUsed =
    cleanValue(profile?.promo_code_used)?.toUpperCase() || metaPromo;

  const lifetimeFree = !!profile?.lifetime_free || promoCodeUsed === "FOUNDERS";
  const billingExempt =
    !!profile?.billing_exempt || promoCodeUsed === "FOUNDERS";

  return {
    email,
    fullName,
    slug,
    customerId: profile?.stripe_customer_id || null,
    subscriptionId: profile?.stripe_subscription_id || null,
    plan: cleanValue(profile?.stripe_plan_key),
    status: cleanValue(profile?.subscription_status),
    createdAt: profile?.created_at || user.created_at || null,
    lifetimeFree,
    billingExempt,
    promoCodeUsed,
  };
}

export default async function AccountPage() {
  const account = await getAccountData();

  const hasAccess =
    !!account?.lifetimeFree ||
    !!account?.billingExempt ||
    account?.status === "active";

  const currentPlan = account?.lifetimeFree
    ? "Founder lifetime access"
    : account?.billingExempt
      ? "Billing exempt"
      : account?.plan || "Not set";

  return (
    <Shell
      footerLeft="Account"
      footerRight="Signal Pass"
      myProfileHref={account?.slug ? `/${account.slug}` : null}
      initialAuth={
        account
          ? {
              email: account.email,
              fullName: account.fullName,
              slug: account.slug,
            }
          : null
      }
      navLinks={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pricing", label: "Pricing" },
      ]}
    >
      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Account</h2>

            <div className="account-grid">
              <div>
                <span className="label">Email</span>
                <div>{account?.email || "—"}</div>
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

          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Plan</h2>

            <div className="account-grid">
              <div>
                <span className="label">Current plan</span>
                <div>{currentPlan}</div>
              </div>

              <div>
                <span className="label">Status</span>
                <div>{account?.status || (hasAccess ? "active" : "—")}</div>
              </div>

              <div>
                <span className="label">Promo code</span>
                <div>{account?.promoCodeUsed || "—"}</div>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {hasAccess && !account?.customerId ? (
                <>
                  <button className="button primary" type="button" disabled>
                    Access included
                  </button>

                  <Link href="/dashboard" className="button secondary">
                    Manage profile
                  </Link>
                </>
              ) : account?.customerId ? (
                <>
                  <form action="/api/portal" method="post">
                    <button className="button primary" type="submit">
                      Manage plan
                    </button>
                  </form>

                  <form action="/api/portal" method="post">
                    <button className="button secondary" type="submit">
                      Cancel subscription
                    </button>
                  </form>

                  <p className="editor-copy" style={{ flexBasis: "100%", margin: "4px 0 0" }}>
                    Plan changes, payment methods, invoices, and cancellations are handled securely through Stripe.
                  </p>
                </>
              ) : (
                <Link href="/pricing" className="button primary">
                  Choose plan
                </Link>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Profile</h2>

            <div className="account-grid">
              <div>
                <span className="label">Profile URL</span>
                <div>
                  {account?.slug ? `/${account.slug}` : "Not issued yet"}
                </div>
              </div>
            </div>

            {account?.slug ? (
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <a href={`/${account.slug}`} className="button secondary">
                  View profile
                </a>

                <Link href="/dashboard" className="button secondary">
                  Edit profile
                </Link>
              </div>
            ) : null}
          </div>

          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Security</h2>

            <p className="editor-copy" style={{ marginTop: 0 }}>
              Update the password used to access your Signal Pass account.
            </p>

            <Link href="/update-password" className="button secondary">
              Change password
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
