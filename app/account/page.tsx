import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import {
  getPlanDisplayLabel,
  getPlanPricingDescription,
  normalizeIndividualPlanKey
} from "@/lib/plans";

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

function billingNoticeFor(value?: string | null) {
  switch (value) {
    case "manual":
      return {
        text: "Billing is managed manually for this account, so there is no Stripe portal action needed."
      };
    default:
      return null;
  }
}

function billingErrorFor(value?: string | null) {
  switch (value) {
    case "missing_customer":
      return "No Stripe customer is connected to this account yet. If you have not activated, choose a plan. If you already paid, contact support so we can reconcile the account.";
    case "profile_lookup":
      return "We could not load your billing profile just now. Please refresh and try again.";
    case "portal_unavailable":
      return "Stripe billing management is temporarily unavailable. Please try again in a few minutes.";
    default:
      return null;
  }
}

export default async function AccountPage({
  searchParams
}: {
  searchParams?: Promise<{
    billing?: string;
    billing_error?: string;
  }>;
}) {
  const account = await getAccountData();
  const params = searchParams ? await searchParams : {};
  const billingNotice = billingNoticeFor(params?.billing);
  const billingError = billingErrorFor(params?.billing_error);

  const hasAccess =
    !!account?.lifetimeFree ||
    !!account?.billingExempt ||
    account?.status === "active";
  const manualBilling = !!account?.lifetimeFree || !!account?.billingExempt;
  const hasActiveSubscription = account?.status === "active" || account?.status === "trialing";

  const normalizedPlan = normalizeIndividualPlanKey(account?.plan);
  const currentPlan = account?.lifetimeFree
    ? "Founder lifetime access"
    : account?.billingExempt
      ? "Billing exempt"
      : getPlanDisplayLabel(normalizedPlan);

  return (
    <Shell
      footerLeft="Account"
      footerRight="CapturePass"
      myProfileHref={hasAccess && account?.slug ? `/${account.slug}` : account ? "/dashboard/preview" : null}
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

            {billingError ? (
              <p className="auth-error" style={{ marginBottom: 16 }}>
                {billingError}
              </p>
            ) : null}

            {billingNotice ? (
              <p className="auth-message" style={{ marginBottom: 16 }}>
                {billingNotice.text}
              </p>
            ) : null}

            <div className="account-grid">
              <div>
                <span className="label">Current plan</span>
                <div>{currentPlan}</div>
              </div>

              <div>
                <span className="label">Status</span>
                <div>{account?.status || (hasAccess ? "active" : "inactive")}</div>
              </div>

              <div>
                <span className="label">Promo code</span>
                <div>{account?.promoCodeUsed || "—"}</div>
              </div>

                  <div>
                    <span className="label">Billing</span>
                    <div>
                  {getPlanPricingDescription(normalizedPlan, {
                    legacySourcePlan: account?.plan,
                    manualBilling,
                    subscriptionStatus: account?.status
                  })}
                    </div>
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
              {manualBilling ? (
                <>
                  <button className="button primary" type="button" disabled aria-disabled="true">
                    Manual billing
                  </button>

                  <Link href="/dashboard" className="button secondary">
                    Manage profile
                  </Link>

                  <p className="editor-copy" style={{ flexBasis: "100%", margin: "4px 0 0" }}>
                  Billing is managed manually for this account. You can continue using CapturePass without opening Stripe billing.
                  </p>
                </>
              ) : account?.customerId ? (
                <>
                  <form action="/api/portal" method="post">
                    <button className="button primary" type="submit">
                      Manage billing in Stripe
                    </button>
                  </form>

                  <p className="editor-copy" style={{ flexBasis: "100%", margin: "4px 0 0" }}>
                    Plan changes, payment methods, invoices, and cancellations are handled securely through Stripe.
                  </p>
                </>
              ) : hasActiveSubscription ? (
                <>
                  <button className="button primary" type="button" disabled aria-disabled="true">
                    Billing unavailable
                  </button>

                  <p className="editor-copy" style={{ flexBasis: "100%", margin: "4px 0 0" }}>
                    This account appears active, but no Stripe customer is connected. Contact support before making billing changes.
                  </p>
                </>
              ) : (
                <>
                  <Link href="/pricing" className="button primary">
                    Activate account
                  </Link>

                  <p className="editor-copy" style={{ flexBasis: "100%", margin: "4px 0 0" }}>
                    Choose Core or above to activate your public profile, QR sharing, and physical NFC card.
                  </p>
                </>
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
                {hasAccess ? (
                  <a href={`/${account.slug}`} className="button secondary">
                    View profile
                  </a>
                ) : (
                  <Link href="/dashboard/preview" className="button secondary">
                    Preview profile
                  </Link>
                )}

                <Link href="/dashboard" className="button secondary">
                  Edit profile
                </Link>
              </div>
            ) : null}
          </div>

          <div className="card" style={{ padding: 26 }}>
            <h2 className="section-title">Security</h2>

            <p className="editor-copy" style={{ marginTop: 0 }}>
              Update the password used to access your CapturePass account.
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
