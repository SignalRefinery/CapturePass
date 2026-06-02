import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getBusinessPlan,
  getBusinessRecurringPriceId,
  getBusinessSetupPriceId,
  normalizeBusinessBillingInterval
} from "@/lib/business/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePlanKey } from "@/lib/plans";
import { slugify } from "@/lib/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

type CheckoutSessionCreateParams = Parameters<
  typeof stripe.checkout.sessions.create
>[0];

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  digital: process.env.STRIPE_DIGITAL_PRICE_ID,
  core: process.env.STRIPE_CORE_PRICE_ID,
  tagg_plus: process.env.STRIPE_TAGG_PLUS_PRICE_ID || process.env.STRIPE_TAGG_PLUS_ANNUAL_PRICE_ID,
  "tagg-plus": process.env.STRIPE_TAGG_PLUS_PRICE_ID || process.env.STRIPE_TAGG_PLUS_ANNUAL_PRICE_ID,
  creator: process.env.STRIPE_CREATOR_PRICE_ID || process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID,
  essential: process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
  "essential-monthly": process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
  "essential-annual": process.env.STRIPE_ESSENTIAL_ANNUAL_PRICE_ID,
  "additional-cards": process.env.STRIPE_ADDITIONAL_TAPTAGG_CARD_PRICE_ID
};

const SETUP_FEE_PRICE_ID = process.env.STRIPE_SETUP_FEE_PRICE_ID || null;
const SETUP_FEE_INCLUDED_PLANS = ["essential", "essential-monthly", "essential-annual"];

type CheckoutPayload = {
  billing?: string;
  plan?: string;
};

function getStringId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

function stripeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: "Unknown Stripe checkout error" };
  }

  const stripeError = error as {
    code?: string;
    message?: string;
    param?: string;
    statusCode?: number;
    type?: string;
  };

  return {
    code: stripeError.code,
    message: stripeError.message || "Unknown Stripe checkout error",
    param: stripeError.param,
    statusCode: stripeError.statusCode,
    type: stripeError.type
  };
}

function isMissingStripeCustomerError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const stripeError = error as {
    code?: string;
    param?: string;
    statusCode?: number;
    type?: string;
  };

  return (
    stripeError.statusCode === 400 &&
    stripeError.type === "StripeInvalidRequestError" &&
    stripeError.code === "resource_missing" &&
    stripeError.param === "customer"
  );
}

async function getPlanFromRequest(req: Request) {
  const url = new URL(req.url);
  const queryPlan = url.searchParams.get("plan");

  if (queryPlan) return queryPlan;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.clone().json().catch(() => ({}))) as CheckoutPayload;
    return body.plan || null;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.clone().formData().catch(() => null);
    const formPlan = formData?.get("plan");
    return typeof formPlan === "string" ? formPlan : null;
  }

  return null;
}

async function getBillingIntervalFromRequest(req: Request) {
  const url = new URL(req.url);
  const queryBilling = url.searchParams.get("billing");

  if (queryBilling) return normalizeBusinessBillingInterval(queryBilling);

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.clone().json().catch(() => ({}))) as CheckoutPayload;
    return normalizeBusinessBillingInterval(body.billing);
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.clone().formData().catch(() => null);
    const formBilling = formData?.get("billing");
    return normalizeBusinessBillingInterval(typeof formBilling === "string" ? formBilling : null);
  }

  return "monthly" as const;
}

async function generateUniqueOrganizationSlug(name: string) {
  const admin = createAdminClient();
  const base = slugify(name) || `business-${Date.now()}`;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  return `${base}-${Date.now()}`;
}

async function getOrCreateCheckoutOrganization({
  userId,
  email,
  fallbackName
}: {
  userId: string;
  email?: string | null;
  fallbackName?: string | null;
}) {
  const admin = createAdminClient();
  const { data: existingOrganization } = await admin
    .from("organizations")
    .select("id, name, slug, stripe_customer_id, stripe_subscription_id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingOrganization) return existingOrganization;

  const businessName =
    fallbackName?.trim() ||
    (email ? `${email.split("@")[0]}'s Business` : "TapTagg Business");
  const slug = await generateUniqueOrganizationSlug(businessName);
  const { data: organization, error } = await admin
    .from("organizations")
    .insert({
      name: businessName,
      slug,
      owner_user_id: userId,
      theme_key: "executive_navy"
    })
    .select("id, name, slug, stripe_customer_id, stripe_subscription_id")
    .single();

  if (error || !organization) {
    throw new Error(error?.message || "Unable to create business organization for checkout.");
  }

  await admin.from("organization_members").insert({
    organization_id: organization.id,
    user_id: userId,
    name: fallbackName?.trim() || email || "Business admin",
    email: email || null,
    role: "owner",
    status: "active"
  });

  return organization;
}

async function createCheckoutOrPortal(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Checkout configuration missing", { route: "/api/checkout" });
      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "unavailable");
      }
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 500 });
    }

    const requestedPlan = await getPlanFromRequest(req);
    const businessBillingInterval = await getBillingIntervalFromRequest(req);
    const businessPlan = getBusinessPlan(requestedPlan);
    const isAdditionalCardsRequest = requestedPlan === "additional-cards";
    const normalizedPlan = normalizePlanKey(requestedPlan);
    const plan = businessPlan
      ? businessPlan.key
      : isAdditionalCardsRequest
      ? "additional-cards"
      : requestedPlan
        ? normalizedPlan === "tagg_plus"
          ? "tagg_plus"
          : normalizedPlan
        : null;

    const selectedPriceId = businessPlan
      ? getBusinessRecurringPriceId(businessPlan, businessBillingInterval) || undefined
      :
      (plan ? PLAN_PRICE_MAP[plan] : undefined) ||
      (requestedPlan ? PLAN_PRICE_MAP[requestedPlan] : undefined);
    const businessSetupPriceId = businessPlan ? getBusinessSetupPriceId(businessPlan) : null;

    if (plan === "business") {
      const businessUrl = new URL("/business", getSiteUrl(req));
      businessUrl.hash = "business-request";
      if (req.method === "GET") {
        return NextResponse.redirect(businessUrl.toString(), { status: 303 });
      }
      return NextResponse.json(
        { error: "Business plans are handled through a quote request.", redirectTo: businessUrl.toString() },
        { status: 400 }
      );
    }

    if (!requestedPlan || !plan || plan === "free") {
      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "choose-plan");
      }

      return NextResponse.json(
        { error: "Choose a TapTagg plan before starting checkout." },
        { status: 400 }
      );
    }

    if (!selectedPriceId || (businessPlan && !businessSetupPriceId)) {
      console.error("Checkout price configuration missing", {
        route: "/api/checkout",
        requestedPlan,
        plan,
        missingRecurringPrice: !selectedPriceId,
        missingSetupPrice: businessPlan ? !businessSetupPriceId : false
      });

      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "unavailable");
      }

      return NextResponse.json(
        { error: "Checkout is temporarily unavailable for this TapTagg plan." },
        { status: 500 }
      );
    }

    const siteUrl = getSiteUrl(req);

    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError && userError.message !== "Auth session missing!") {
      console.error("Checkout auth lookup failed", {
        route: "/api/checkout",
        error: userError.message
      });
      if (req.method === "GET") {
        return redirectWithParam(req, "/login", "auth_error", "checkout");
      }
      return NextResponse.json(
        { error: "Unable to verify your session. Please sign in and try again." },
        { status: 500 }
      );
    }

    if (!user) {
      const signupUrl = new URL("/signup", siteUrl);
      signupUrl.searchParams.set("plan", plan);
      signupUrl.searchParams.set(
        "next",
        `/api/checkout?plan=${encodeURIComponent(plan)}${businessPlan ? `&billing=${businessBillingInterval}` : ""}`
      );
      return NextResponse.redirect(signupUrl.toString(), { status: 303 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, stripe_customer_id, stripe_subscription_id, stripe_plan_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Checkout profile lookup failed", {
        route: "/api/checkout",
        userId: user.id,
        plan,
        error: profileError.message
      });
      if (req.method === "GET") {
        return redirectWithParam(req, "/account", "billing_error", "profile_lookup");
      }
      return NextResponse.json(
        { error: "Unable to load your account for checkout. Please try again." },
        { status: 500 }
      );
    }

    const isAdditionalCardsCheckout =
      isAdditionalCardsRequest ||
      selectedPriceId === process.env.STRIPE_ADDITIONAL_TAPTAGG_CARD_PRICE_ID;
    const isCoreCheckout = plan === "core";
    const checkoutOrganization = businessPlan
      ? await getOrCreateCheckoutOrganization({
          userId: user.id,
          email: user.email,
          fallbackName: profile?.full_name
        })
      : null;

    if (businessPlan && checkoutOrganization?.stripe_customer_id && checkoutOrganization?.stripe_subscription_id) {
      let portal: Stripe.BillingPortal.Session;
      try {
        portal = await stripe.billingPortal.sessions.create({
          customer: checkoutOrganization.stripe_customer_id,
          return_url: `${siteUrl}/dashboard/business?org=${checkoutOrganization.id}`
        });
      } catch (error) {
        console.error("Business checkout portal redirect failed", {
          route: "/api/checkout",
          userId: user.id,
          organizationId: checkoutOrganization.id,
          plan,
          error: error instanceof Error ? error.message : "Unknown Stripe portal error"
        });
        if (req.method === "GET") {
          return redirectWithParam(req, "/pricing", "checkout", "start-error");
        }
        return NextResponse.json({ error: "Unable to open billing management. Please try again." }, { status: 500 });
      }

      return NextResponse.redirect(portal.url, { status: 303 });
    }

    if (profile?.stripe_customer_id && profile?.stripe_subscription_id && !isAdditionalCardsCheckout && !isCoreCheckout && !businessPlan) {
      let portal: Stripe.BillingPortal.Session;
      try {
        portal = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id,
          return_url: `${siteUrl}/account`
        });
      } catch (error) {
        console.error("Checkout portal redirect failed", {
          route: "/api/checkout",
          userId: user.id,
          plan,
          hasCustomerId: true,
          error: error instanceof Error ? error.message : "Unknown Stripe portal error"
        });
        if (req.method === "GET") {
          return redirectWithParam(req, "/account", "billing_error", "portal_unavailable");
        }
        return NextResponse.json({ error: "Unable to open billing management. Please try again." }, { status: 500 });
      }

      return NextResponse.redirect(portal.url, { status: 303 });
    }

    const mode = isAdditionalCardsCheckout || isCoreCheckout ? "payment" : "subscription";
    const collectsShipping = plan !== "digital";
    const successUrl = businessPlan && checkoutOrganization
      ? `${siteUrl}/dashboard/business?checkout=success&session_id={CHECKOUT_SESSION_ID}&org=${checkoutOrganization.id}`
      : `${siteUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/pricing`;
    const sessionParamsFor = (customerId?: string | null): CheckoutSessionCreateParams => ({
      mode,
      ...(customerId
        ? { customer: customerId }
        : {
            customer_email: user.email || undefined,
            ...(mode === "payment" ? { customer_creation: "always" as const } : {})
          }),
      ...(collectsShipping
        ? {
            shipping_address_collection: {
              allowed_countries: ["US"]
            }
          }
        : {}),
      billing_address_collection: "required",
      line_items: [
        ...(businessPlan && businessSetupPriceId
          ? [
              {
                price: businessSetupPriceId,
                quantity: 1
              }
            ]
          : []),
        ...(SETUP_FEE_PRICE_ID && SETUP_FEE_INCLUDED_PLANS.includes(plan)
          ? [
              {
                price: SETUP_FEE_PRICE_ID,
                quantity: 1
              }
            ]
          : []),
        {
          price: selectedPriceId,
          quantity: 1,
          ...(isAdditionalCardsCheckout
            ? {
                adjustable_quantity: {
                  enabled: true,
                  minimum: 1,
                  maximum: 50
                }
              }
            : {})
        }
      ],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan,
        selected_plan: plan,
        ...(businessPlan && checkoutOrganization
          ? {
              checkout_type: "business",
              organization_id: checkoutOrganization.id,
              business_plan_key: businessPlan.key,
              business_plan_tier: businessPlan.tier,
              business_billing_interval: businessBillingInterval
            }
          : {})
      },
      ...(mode === "payment"
        ? {}
        : {
            subscription_data: {
              metadata: {
                user_id: user.id,
                plan,
                selected_plan: plan,
                ...(businessPlan && checkoutOrganization
                  ? {
                      checkout_type: "business",
                      organization_id: checkoutOrganization.id,
                      business_plan_key: businessPlan.key,
                      business_plan_tier: businessPlan.tier,
                      business_billing_interval: businessBillingInterval
                    }
                  : {})
              }
            }
          })
    });

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(
        sessionParamsFor(businessPlan ? checkoutOrganization?.stripe_customer_id : profile?.stripe_customer_id)
      );
    } catch (error) {
      if (profile?.stripe_customer_id && isMissingStripeCustomerError(error)) {
        console.warn("Checkout retrying without stale Stripe customer", {
          route: "/api/checkout",
          userId: user.id,
          plan,
          staleCustomerId: profile.stripe_customer_id,
          error: stripeErrorDetails(error)
        });

        try {
          session = await stripe.checkout.sessions.create(sessionParamsFor(null));
        } catch (retryError) {
          console.error("Checkout session creation retry failed", {
            route: "/api/checkout",
            userId: user.id,
            plan,
            mode,
            hasCustomerId: false,
            originalError: stripeErrorDetails(error),
            retryError: stripeErrorDetails(retryError)
          });
          if (req.method === "GET") {
            return redirectWithParam(req, "/pricing", "checkout", "start-error");
          }
          return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
        }
      } else {
        console.error("Checkout session creation failed", {
          route: "/api/checkout",
          userId: user.id,
          plan,
          mode,
          hasCustomerId: !!profile?.stripe_customer_id,
          successUrl,
          error: stripeErrorDetails(error)
        });
        if (req.method === "GET") {
          return redirectWithParam(req, "/pricing", "checkout", "start-error");
        }
        return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
      }
    }

    if (!session.url) {
      console.error("Checkout session missing redirect URL", {
        route: "/api/checkout",
        userId: user.id,
        plan,
        sessionId: session.id
      });
      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "start-error");
      }
      return NextResponse.json(
        { error: "Unable to start checkout. Please try again." },
        { status: 500 }
      );
    }

    console.info("Checkout session created", {
      route: "/api/checkout",
      userId: user.id,
      plan,
      mode,
      sessionId: session.id,
      successUrl,
      cancelUrl
    });

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown checkout error";
    console.error("Checkout request failed", {
      route: "/api/checkout",
      error: message
    });
    if (req.method === "GET") {
      return redirectWithParam(req, "/pricing", "checkout", "start-error");
    }
    return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return createCheckoutOrPortal(req);
}

export async function GET(req: Request) {
  return createCheckoutOrPortal(req);
}

function getSiteUrl(req: Request) {
  const requestOrigin = new URL(req.url).origin;
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    requestOrigin;

  try {
    const parsedUrl = new URL(configuredUrl);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.origin.replace(/\/$/, "");
    }
  } catch {}

  console.warn("Ignoring invalid configured app URL for checkout", {
    route: "/api/checkout",
    configuredUrl
  });

  return requestOrigin.replace(/\/$/, "");
}

function redirectWithParam(req: Request, path: string, key: string, value: string) {
  const url = new URL(path, getSiteUrl(req));
  url.searchParams.set(key, value);
  return NextResponse.redirect(url.toString(), { status: 303 });
}
