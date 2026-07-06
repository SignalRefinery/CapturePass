import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { InactiveState } from "@/components/dashboard/inactive-state";
import { PersonalPerformancePanel } from "@/components/gamification/gamification-panels";
import { checkoutContinuationPath } from "@/lib/auth/checkout-continuation";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import {
  getProfileForUserServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  applyFounderAccess,
  BUSINESS_INDIVIDUAL_PLAN_KEY,
  getProfilePlan,
  resolveCheckoutPlanSelection
} from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { slugify } from "@/lib/utils";
import { getPersonalGamificationSummary } from "@/lib/gamification/server";
import { buildQuickChartQrUrl } from "@/lib/notifications/qr";
import type { ProfileRecord } from "@/lib/types";
import { getSiteOrigin } from "@/lib/site-url";
import {
  applyBusinessTypePrimaryLinkDefaults,
  getBusinessTypePrimaryLinkDefaults
} from "@/lib/business-types";
import { getBusinessTypeForUser } from "@/lib/business/organization-access";

const PENDING_CHECKOUT_COOKIE = "taptagg_pending_checkout";

function passHrefFor(profile: ProfileRecord) {
  if (profile.private_token) {
    return `/pass/${profile.private_token}`;
  }

  if (profile.slug) {
    return `/${profile.slug}`;
  }

  return "/dashboard";
}

function getStringId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

function cleanMetadataValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function getCheckoutSearchParam(path: string | null, key: string) {
  if (!path?.startsWith("/api/checkout")) return null;

  try {
    return cleanMetadataValue(new URL(path, "https://capturepass.local").searchParams.get(key));
  } catch {
    return null;
  }
}

async function reconcileCheckoutSuccess(sessionId: string | null | undefined, userId: string) {
  if (!sessionId) {
    console.warn("Dashboard checkout success missing session id", {
      route: "/dashboard",
      userId
    });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"]
    });
    const sessionUserId = session.metadata?.user_id || null;
    const rawPlan = session.metadata?.plan || session.metadata?.selected_plan || null;
    const checkoutSelection = resolveCheckoutPlanSelection(rawPlan);
    const plan = checkoutSelection?.kind === "individual" ? checkoutSelection.plan : null;
    const checkoutComplete = session.status === "complete";
    const paymentComplete =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";

    if (sessionUserId !== userId) {
      console.warn("Dashboard checkout reconciliation skipped for user mismatch", {
        route: "/dashboard",
        userId,
        sessionId,
        sessionUserId
      });
      return;
    }

    if (!checkoutComplete || !paymentComplete || !plan || plan === "free") {
      console.warn("Dashboard checkout reconciliation skipped for incomplete session", {
        route: "/dashboard",
        userId,
        sessionId,
        plan,
        sessionStatus: session.status,
        paymentStatus: session.payment_status
      });
      return;
    }

    const customerId = getStringId(session.customer);
    const subscriptionId = getStringId(session.subscription);
    const admin = createAdminClient();
    const updatePayload =
      session.mode === "subscription"
        ? {
            is_active: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_plan_key: plan,
            subscription_status: "active"
          }
        : {
            is_active: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            stripe_plan_key: plan,
            subscription_status: "active"
          };

    const { data, error } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", userId)
      .select("user_id, is_active, stripe_customer_id, stripe_subscription_id, stripe_plan_key, subscription_status")
      .maybeSingle();

    if (error) {
      console.error("Dashboard checkout reconciliation failed", {
        route: "/dashboard",
        userId,
        sessionId,
        plan,
        error: error.message
      });
      return;
    }

    console.info("Dashboard checkout reconciliation updated profile", {
      route: "/dashboard",
      userId,
      sessionId,
      plan,
      customerId,
      subscriptionId,
      isActive: data?.is_active || false,
      stripePlanKey: data?.stripe_plan_key || null,
      subscriptionStatus: data?.subscription_status || null
    });
  } catch (error) {
    console.error("Dashboard checkout reconciliation threw", {
      route: "/dashboard",
      userId,
      sessionId,
      error: error instanceof Error ? error.message : "Unknown checkout reconciliation error"
    });
  }
}

async function submitFounderCardClaim(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, slug, private_token, billing_exempt, lifetime_free, promo_code_used")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.billing_exempt && !profile?.lifetime_free && profile?.promo_code_used !== "FOUNDERS") {
    redirect("/dashboard");
  }

  const shippingName = String(formData.get("shipping_name") || "").trim();
  const line1 = String(formData.get("line1") || "").trim();
  const line2 = String(formData.get("line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const postalCode = String(formData.get("postal_code") || "").trim();

  if (!shippingName || !line1 || !city || !state || !postalCode) {
    redirect("/dashboard?claim_founder_card=1&claim_error=missing_fields");
  }

  const siteUrl = getSiteOrigin();
  const tokenUrl = profile?.private_token ? `${siteUrl}/u/${profile.private_token}` : null;
  const qrUrl = buildQuickChartQrUrl(tokenUrl);

  if (!process.env.RESEND_API_KEY) {
    redirect("/dashboard?claim_founder_card=1&claim_error=email_not_configured");
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "CapturePass <notifications@capturepass.com>",
      to: "support@capturepass.com",
      subject: `Founder card claimed: ${shippingName}`,
      html: `
        <h2>Founder card claimed</h2>
        <p><strong>Name:</strong> ${profile?.full_name || shippingName}</p>
        <p><strong>Email:</strong> ${profile?.email || user.email || "—"}</p>
        <p><strong>Promo:</strong> ${profile?.promo_code_used || "FOUNDERS"}</p>
        <p><strong>Shipping Address:</strong><br />
          ${shippingName}<br />
          ${line1}<br />
          ${line2 ? `${line2}<br />` : ""}
          ${city}, ${state} ${postalCode}<br />
          US
        </p>
        <p><strong>Slug:</strong> ${profile?.slug || "—"}</p>
        ${tokenUrl ? `<p><strong>Card / QR URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>` : ""}
        ${qrUrl ? `<p><strong>QR image URL:</strong> <a href="${qrUrl}">${qrUrl}</a></p><p><img src="${qrUrl}" alt="QR code" width="300" height="300" /></p>` : ""}
      `
    })
  });

  if (!resendResponse.ok) {
    redirect("/dashboard?claim_founder_card=1&claim_error=email_failed");
  }

  redirect("/dashboard?founder_card_claimed=1");
}

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

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{
    claim_founder_card?: string;
    checkout?: string;
    founder_card_claimed?: string;
    claim_error?: string;
    session_id?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const pendingCheckoutCookie = cleanMetadataValue(cookieStore.get(PENDING_CHECKOUT_COOKIE)?.value);

  if (params?.checkout === "success") {
    await reconcileCheckoutSuccess(params.session_id, user.id);
  }

  const initialAuth = await getInitialAuth();
  const existing = await getProfileForUserServer(user.id);
  const businessType = await getBusinessTypeForUser(user.id);
  const businessPrimaryLinkDefaults = getBusinessTypePrimaryLinkDefaults(businessType);

  const firstName = user.user_metadata?.first_name || "";
  const lastName = user.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user.email || "";

  const baseProfile =
    existing
      ? {
          ...applyBusinessTypePrimaryLinkDefaults(existing, businessType),
          business_type:
            existing.business_type && existing.business_type !== "general_business"
              ? existing.business_type
              : businessType
        }
      : {
          user_id: user.id,
          business_type: businessType,
          full_name: fullName,
          organization_name: "",
          slug:
            user.user_metadata?.suggested_slug ||
            slugify(fullName) ||
            slugify(email.split("@")[0] || "") ||
            `profile-${user.id.slice(0, 8)}`,
          role_line: "",
          intro: "",
          email,
          phone: "",
          text_phone: "",
          website_url: "",
          show_text: true,
          secondary_action_mode: "text",
          theme_key: "capturepass_brand",
          profile_badge_1: "",
          profile_badge_2: "",
          profile_badge_3: "",
          ...(businessPrimaryLinkDefaults || {
            primary_link_1_title: "Call",
            primary_link_1_url: "",
            primary_link_1_type: "phone",
            primary_link_2_title: "Email",
            primary_link_2_url: "",
            primary_link_2_type: "email",
            primary_link_3_title: "Website 1",
            primary_link_3_url: "",
            primary_link_3_type: "website",
            primary_link_4_title: "Website",
            primary_link_4_url: "",
            primary_link_4_type: "website"
          }),
          page_mode: "single",
          multi_view_display_mode: "favorite",
          default_view_id: null,
          is_active: false,
          referral_code: null,
          referred_by: user.user_metadata?.referral_code_used || null,
          is_affiliate: false,
          affiliate_tier: null,
          billing_exempt: false,
          lifetime_free: false,
          promo_code_used: user.user_metadata?.promo_code || null,
          is_public_official: !!user.user_metadata?.is_public_official,
          consent_public_visibility: true
        };
  const initialProfile = applyFounderAccess(baseProfile, user.user_metadata?.promo_code) || baseProfile;
  const initialProfileViews = initialProfile.id
    ? await getProfileViewsForProfileServer(initialProfile.id)
    : [];
  const gamificationSummary = await getPersonalGamificationSummary({
    userId: user.id,
    profileId: initialProfile.id || null,
  });

  const plan = getProfilePlan(initialProfile);
  const fullAccess = plan.isActivated;
  const checkoutSuccess = params?.checkout === "success";
  const activationPending = checkoutSuccess && !fullAccess;
  const selectedPlan = cleanMetadataValue(user.user_metadata?.selected_plan);
  const metadataBusinessType = cleanMetadataValue(user.user_metadata?.selected_business_type);
  const savedCheckoutPath =
    cleanMetadataValue(user.user_metadata?.checkout_next_path) || pendingCheckoutCookie;
  const savedCheckoutPlan = getCheckoutSearchParam(savedCheckoutPath, "plan");
  const savedCheckoutBusinessType = getCheckoutSearchParam(savedCheckoutPath, "business_type");
  const pendingCheckoutPlan =
    selectedPlan ||
    savedCheckoutPlan ||
    (metadataBusinessType || savedCheckoutBusinessType ? BUSINESS_INDIVIDUAL_PLAN_KEY : null);
  const selectedBusinessType =
    metadataBusinessType ||
    savedCheckoutBusinessType ||
    (initialProfile.business_type && initialProfile.business_type !== "general_business"
      ? initialProfile.business_type
      : null);
  const selectedPromoCode =
    cleanMetadataValue(user.user_metadata?.promo_code) ||
    getCheckoutSearchParam(savedCheckoutPath, "promo_code");

  if (
    !fullAccess &&
    !activationPending &&
    pendingCheckoutPlan === BUSINESS_INDIVIDUAL_PLAN_KEY
  ) {
    const fallbackPath = selectedBusinessType
      ? checkoutContinuationPath({
          businessType: selectedBusinessType,
          plan: pendingCheckoutPlan,
          promoCode: selectedPromoCode
        })
      : "/business-individual";
    const nextCheckoutPath = savedCheckoutPath?.startsWith("/api/checkout")
      ? safeInternalRedirect(savedCheckoutPath, fallbackPath)
      : fallbackPath;

    redirect(nextCheckoutPath === "/dashboard" ? fallbackPath : nextCheckoutPath);
  }

  const myProfileHref = fullAccess && initialProfile.slug ? `/${initialProfile.slug}` : "/dashboard/preview";
  const passOptions = [
    {
      href: passHrefFor(initialProfile),
      label: "CapturePass digital pass",
      description: "Shows your QR for your single CapturePass profile"
    }
  ];

  const showFounderClaimForm =
    params?.claim_founder_card === "1" &&
    (!!initialProfile.billing_exempt || !!initialProfile.lifetime_free || initialProfile.promo_code_used === "FOUNDERS");

  const founderClaimed = params?.founder_card_claimed === "1";
  const claimError = params?.claim_error || null;

  if (!fullAccess) {
    console.warn("Dashboard access pending or inactive", {
      route: "/dashboard",
      userId: user.id,
      checkout: params?.checkout || null,
      checkoutSessionId: params?.session_id || null,
      reason: activationPending
        ? "checkout_success_webhook_pending"
        : "profile_not_active",
      hasProfile: !!existing,
      isActive: !!initialProfile.is_active,
      stripePlanKey: initialProfile.stripe_plan_key || null,
      subscriptionStatus: initialProfile.subscription_status || null,
      billingExempt: !!initialProfile.billing_exempt,
      lifetimeFree: !!initialProfile.lifetime_free
    });
  }

  return (
    <Shell
      footerLeft="Dashboard"
      footerRight="CapturePass"
      myProfileHref={myProfileHref}
      initialAuth={initialAuth}
      pageVariant="light"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard#performance", label: "Performance" },
        { href: "/dashboard/contacts", label: "Contacts" },
        { href: "/dashboard/analytics", label: "Analytics" },
        { href: "/partners", label: "Partners" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Dashboard</span>
        </div>
        <h1>{fullAccess ? "Manage your live profile." : "Build your reserved profile."}</h1>
        <p>
          You are signed in as <strong>{user.email}</strong>.{" "}
          {fullAccess
            ? "Refine your public presence, keep your links current, and control how your profile is presented."
            : "Your @tagg can be edited and previewed now. Activate Business Individual or a business plan when you are ready to make it publicly live."}
        </p>
      </section>

      <>
          {founderClaimed ? (
            <section className="dashboard-wrap">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Founder card</div>
                <h2>Founder card claim received.</h2>
                <p className="editor-copy">
                  Your shipping details were sent successfully. You can continue editing your profile below.
                </p>
              </div>
            </section>
          ) : null}

          {checkoutSuccess ? (
            <section className="dashboard-wrap">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Checkout</div>
                <h2>{fullAccess ? "Your CapturePass is active." : "Activating your account."}</h2>
                <p className="editor-copy">
                  {fullAccess
                    ? "Your checkout is complete and your CapturePass profile is ready to manage."
                    : "Checkout is complete. Stripe is finishing activation, which can take a few moments. Refresh this page shortly if your account is still preview-only."}
                </p>
              </div>
            </section>
          ) : null}

          {!fullAccess && !activationPending ? <InactiveState email={user.email || ""} /> : null}

          {fullAccess ? (
            <>
          {showFounderClaimForm ? (
            <section className="dashboard-wrap">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Founder card</div>
                <h2>Claim your founder card.</h2>
                <p className="editor-copy">
                  Founder access bypasses Stripe, so enter your shipping details here to have your physical CapturePass card prepared.
                </p>

                {claimError ? (
                  <p className="editor-copy">
                    {claimError === "email_failed"
                      ? "The claim was submitted, but the notification email failed to send. Check the Resend configuration and try again."
                      : claimError === "email_not_configured"
                        ? "The claim form is working, but the email service is not configured. Add RESEND_API_KEY and try again."
                        : "Please complete the required shipping fields before submitting."}
                  </p>
                ) : null}

                <form action={submitFounderCardClaim} className="editor-form">
                  <label className="editor-label">
                    Shipping name
                    <input
                      className="editor-input"
                      name="shipping_name"
                      defaultValue={initialProfile.full_name || ""}
                      required
                    />
                  </label>

                  <label className="editor-label">
                    Address line 1
                    <input className="editor-input" name="line1" required />
                  </label>

                  <label className="editor-label">
                    Address line 2
                    <input className="editor-input" name="line2" />
                  </label>

                  <div className="editor-grid">
                    <label className="editor-label">
                      City
                      <input className="editor-input" name="city" required />
                    </label>

                    <label className="editor-label">
                      State
                      <input className="editor-input" name="state" maxLength={2} required />
                    </label>

                    <label className="editor-label">
                      ZIP
                      <input className="editor-input" name="postal_code" inputMode="numeric" required />
                    </label>
                  </div>

                  <button className="button button-primary" type="submit">
                    Send founder card claim
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          <section className="dashboard-wrap">
            <div className="dashboard-card">
              <div className="dashboard-kicker">Digital pass</div>
              <h2>Open your QR pass.</h2>
              <p className="editor-copy">
                Show your QR when you do not have your physical card, or save your CapturePass pass to your phone home screen.
              </p>
              <Link href={passOptions[0].href} className="button primary" style={{ marginTop: 20 }}>
                Open Digital Pass
              </Link>
            </div>
          </section>
            </>
          ) : null}

          <PersonalPerformancePanel summary={gamificationSummary} />

          <ProfileEditor
            userId={user.id}
            initialProfile={initialProfile}
            initialProfileViews={initialProfileViews}
            businessType={businessType}
          />

          <section className="dashboard-wrap status-bottom">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Profile status</div>
                <h2>Account and plan</h2>
                <p className="editor-copy">
                  A concise view of your current access level, referral standing, and account state.
                </p>
                <div className="status-list">
                  <div className="status-row">
                    <span>Access</span>
                    <strong>{fullAccess ? "Active" : "Reserved / preview only"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Plan</span>
                    <strong>
                      {initialProfile.lifetime_free
                        ? "Founder lifetime access"
                        : plan.isActivated
                          ? plan.key === "business_individual"
                            ? "Business Individual"
                            : "Business plan"
                          : "Reserved profile"}
                    </strong>
                  </div>
                  <div className="status-row">
                    <span>Referral code</span>
                    <strong>{initialProfile.referral_code || "Pending"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Affiliate standing</span>
                    <strong>{initialProfile.is_affiliate ? initialProfile.affiliate_tier || "Affiliate" : "Standard user"}</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-kicker">Compliance</div>
                <h2>Flags and origin details</h2>
                <p className="editor-copy">
                  This section surfaces signup context and any role-based items that may matter later.
                </p>
                <div className="status-list">
                  <div className="status-row">
                    <span>Public official / government-facing role</span>
                    <strong>{initialProfile.is_public_official ? "Flagged" : "No"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Promo code used</span>
                    <strong>{initialProfile.promo_code_used || "None"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Referred by</span>
                    <strong>{initialProfile.referred_by || "Direct signup"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
      </>
    </Shell>
  );
}
