import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getBusinessPlan,
  getBusinessRecurringPriceId,
  getBusinessSetupPriceId,
  normalizeBusinessBillingInterval
} from "@/lib/business/plans";
import { BUSINESS_TYPES, normalizeBusinessType, type BusinessType } from "@/lib/business-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  BUSINESS_INDIVIDUAL_EXTRA_CARD_PLAN_KEY,
  BUSINESS_INDIVIDUAL_LAUNCH_OFFER,
  BUSINESS_INDIVIDUAL_PLAN_KEY,
  BUSINESS_INDIVIDUAL_PROMO_CODE,
  BUSINESS_INDIVIDUAL_REGULAR_PRICE_AFTER,
  getIndividualPlanPriceId,
  isBusinessIndividualPromoCode,
  resolveCheckoutPlanSelection
} from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { slugify } from "@/lib/utils";

type CheckoutSessionCreateParams = Parameters<
  typeof stripe.checkout.sessions.create
>[0];

type CheckoutPayload = {
  billing?: string;
  business_type?: string;
  plan?: string;
  promo_code?: string;
};

// Launch promotion: business setup fees are temporarily waived.
// TODO: Re-enable business plan setup fee charges after 2026-07-31.
const BUSINESS_SETUP_FEES_WAIVED_FOR_LAUNCH = true;
const PENDING_CHECKOUT_COOKIE = "taptagg_pending_checkout";
const PENDING_CHECKOUT_COOKIE_MAX_AGE = 60 * 30;
const ADDITIONAL_CARD_PRICE_ID =
  process.env.STRIPE_ADDITIONAL_CAPTUREPASS_CARD_PRICE_ID ||
  process.env.STRIPE_ADDITIONAL_TAPTAGG_CARD_PRICE_ID ||
  undefined;

function getStringId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

function normalizePromoCode(value?: string | null) {
  const normalized = (value || "").trim().toUpperCase();
  return normalized || null;
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

async function getPromoCodeFromRequest(req: Request) {
  const url = new URL(req.url);
  const queryPromo = url.searchParams.get("promo_code");

  if (queryPromo) return queryPromo;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.clone().json().catch(() => ({}))) as CheckoutPayload;
    return body.promo_code || null;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.clone().formData().catch(() => null);
    const formPromo = formData?.get("promo_code");
    return typeof formPromo === "string" ? formPromo : null;
  }

  return null;
}

async function getBusinessTypeFromRequest(req: Request) {
  const url = new URL(req.url);
  const queryBusinessType = url.searchParams.get("business_type");

  if (queryBusinessType) return queryBusinessType;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.clone().json().catch(() => ({}))) as CheckoutPayload;
    return body.business_type || null;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.clone().formData().catch(() => null);
    const formBusinessType = formData?.get("business_type");
    return typeof formBusinessType === "string" ? formBusinessType : null;
  }

  return null;
}

function parseSelectedBusinessType(value?: string | null) {
  const trimmed = (value || "").trim();

  if (!trimmed) {
    return { value: null, error: "missing" as const };
  }

  if (!BUSINESS_TYPES.includes(trimmed as BusinessType)) {
    return { value: null, error: "invalid" as const };
  }

  return { value: normalizeBusinessType(trimmed), error: null };
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
    (email ? `${email.split("@")[0]}'s Business` : "CapturePass Business");
  const slug = await generateUniqueOrganizationSlug(businessName);
  const { data: organization, error } = await admin
    .from("organizations")
    .insert({
      name: businessName,
      slug,
      owner_user_id: userId,
      theme_key: "taptagg_brand"
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

async function activateFounderBusinessCheckout({
  organizationId,
  businessPlan,
  billingInterval
}: {
  organizationId: string;
  businessPlan: ReturnType<typeof getBusinessPlan>;
  billingInterval: ReturnType<typeof normalizeBusinessBillingInterval>;
}) {
  if (!businessPlan) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({
      business_plan_key: businessPlan.key,
      business_billing_interval: billingInterval,
      seat_limit: businessPlan.seatLimit,
      included_card_count: businessPlan.includedCards,
      card_allotment_total: businessPlan.includedCards,
      is_managed: businessPlan.managed,
      managed_service_enabled: businessPlan.managed,
      subscription_status: "active"
    })
    .eq("id", organizationId);

  if (error) {
    throw new Error(error.message || "Unable to activate founder business checkout.");
  }
}

async function activateBusinessIndividualPromoCheckout({
  businessType,
  promoCode,
  userId
}: {
  businessType: BusinessType;
  promoCode: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({
      business_type: businessType,
      is_active: true,
      stripe_plan_key: BUSINESS_INDIVIDUAL_PLAN_KEY,
      subscription_status: "active",
      billing_exempt: true,
      lifetime_free: false,
      promo_code_used: promoCode
    })
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Unable to activate Business Individual promo checkout.");
  }
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
    const promoCode = normalizePromoCode(await getPromoCodeFromRequest(req));
    const selectedBusinessType = parseSelectedBusinessType(await getBusinessTypeFromRequest(req));
    const checkoutSelection = resolveCheckoutPlanSelection(requestedPlan);
    const businessPlan = checkoutSelection?.kind === "business" ? checkoutSelection.plan : null;
    const individualPlan = checkoutSelection?.kind === "individual" ? checkoutSelection.plan : null;
    const isBusinessIndividualCheckout = individualPlan === BUSINESS_INDIVIDUAL_PLAN_KEY;
    const isBusinessIndividualExtraCardCheckout =
      checkoutSelection?.kind === "business_individual_extra_card";
    const checkoutPlanKey =
      businessPlan?.key ||
      individualPlan ||
      (checkoutSelection?.kind === "additional_cards" ? "additional-cards" : null) ||
      (isBusinessIndividualExtraCardCheckout ? BUSINESS_INDIVIDUAL_EXTRA_CARD_PLAN_KEY : null);
    const sessionPlanKey =
      businessPlan?.key ||
      individualPlan ||
      (checkoutSelection?.kind === "additional_cards" ? "additional-cards" : null) ||
      (isBusinessIndividualExtraCardCheckout ? BUSINESS_INDIVIDUAL_EXTRA_CARD_PLAN_KEY : null);
    const selectedPriceId = businessPlan
      ? getBusinessRecurringPriceId(businessPlan, businessBillingInterval) || undefined
      : checkoutSelection?.kind === "individual"
        ? getIndividualPlanPriceId(checkoutSelection.plan) || undefined
        : checkoutSelection?.kind === "additional_cards"
          ? ADDITIONAL_CARD_PRICE_ID
          : isBusinessIndividualExtraCardCheckout
            ? process.env.STRIPE_PRICE_BUSINESS_INDIVIDUAL_EXTRA_CARD || undefined
          : undefined;
    const businessSetupPriceId = businessPlan ? getBusinessSetupPriceId(businessPlan) : null;
    const businessSetupFeeWaived =
      !!businessPlan && BUSINESS_SETUP_FEES_WAIVED_FOR_LAUNCH;
    const plan =
      checkoutSelection?.kind === "individual"
        ? checkoutSelection.plan
        : checkoutSelection?.kind === "additional_cards"
          ? "additional-cards"
          : isBusinessIndividualExtraCardCheckout
            ? BUSINESS_INDIVIDUAL_EXTRA_CARD_PLAN_KEY
          : null;

    if (!requestedPlan) {
      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "choose-plan");
      }

      return NextResponse.json(
        { error: "Choose a CapturePass plan before starting checkout." },
        { status: 400 }
      );
    }

    if (!checkoutSelection) {
      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "invalid-plan");
      }

      return NextResponse.json(
        { error: "That checkout plan is not supported. Choose a CapturePass plan instead." },
        { status: 400 }
      );
    }

    if (individualPlan === "free") {
      if (req.method === "GET") {
        return redirectWithParam(req, "/pricing", "checkout", "choose-plan");
      }

      return NextResponse.json(
        { error: "Choose a CapturePass plan before starting checkout." },
        { status: 400 }
      );
    }

    if (isBusinessIndividualCheckout && selectedBusinessType.error) {
      if (req.method === "GET") {
        return redirectWithParam(
          req,
          "/business-individual",
          "checkout",
          selectedBusinessType.error === "missing" ? "missing-business-type" : "invalid-business-type"
        );
      }

      return NextResponse.json(
        { error: "Choose a business type before starting Business Individual checkout." },
        { status: 400 }
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
      if (checkoutPlanKey) {
        signupUrl.searchParams.set("plan", checkoutPlanKey);
      }
      if (promoCode) {
        signupUrl.searchParams.set("promo_code", promoCode);
      }
      if (selectedBusinessType.value) {
        signupUrl.searchParams.set("business_type", selectedBusinessType.value);
      }

      const checkoutParams = new URLSearchParams();
      checkoutParams.set("plan", checkoutPlanKey || "");
      if (businessPlan) checkoutParams.set("billing", businessBillingInterval);
      if (promoCode) checkoutParams.set("promo_code", promoCode);
      if (selectedBusinessType.value) {
        checkoutParams.set("business_type", selectedBusinessType.value);
      }

      const pendingCheckoutPath = `/api/checkout?${checkoutParams.toString()}`;
      signupUrl.searchParams.set("next", pendingCheckoutPath);

      const response = NextResponse.redirect(signupUrl.toString(), { status: 303 });
      response.cookies.set(PENDING_CHECKOUT_COOKIE, pendingCheckoutPath, {
        httpOnly: true,
        maxAge: PENDING_CHECKOUT_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: siteUrl.startsWith("https://")
      });

      return response;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, stripe_customer_id, stripe_subscription_id, stripe_plan_key, promo_code_used")
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
      checkoutSelection?.kind === "additional_cards" ||
      isBusinessIndividualExtraCardCheckout ||
      selectedPriceId === ADDITIONAL_CARD_PRICE_ID;
    const checkoutOrganization = businessPlan
      ? await getOrCreateCheckoutOrganization({
          userId: user.id,
          email: user.email,
          fallbackName: profile?.full_name
        })
      : null;

    const isFounderPromo =
      promoCode === "FOUNDERS" || normalizePromoCode(profile?.promo_code_used) === "FOUNDERS";
    const isBusinessIndividualPromo =
      isBusinessIndividualCheckout &&
      (isBusinessIndividualPromoCode(promoCode) ||
        isBusinessIndividualPromoCode(profile?.promo_code_used));

    if (businessPlan && checkoutOrganization && isFounderPromo) {
      await activateFounderBusinessCheckout({
        organizationId: checkoutOrganization.id,
        businessPlan,
        billingInterval: businessBillingInterval
      });

      const founderBusinessUrl = new URL("/dashboard/business", siteUrl);
      founderBusinessUrl.searchParams.set("org", checkoutOrganization.id);
      founderBusinessUrl.searchParams.set("checkout", "success");

      return NextResponse.redirect(founderBusinessUrl.toString(), { status: 303 });
    }

    if (isBusinessIndividualCheckout && selectedBusinessType.value && isBusinessIndividualPromo) {
      await activateBusinessIndividualPromoCheckout({
        businessType: selectedBusinessType.value,
        promoCode: BUSINESS_INDIVIDUAL_PROMO_CODE,
        userId: user.id
      });

      const businessIndividualUrl = new URL("/dashboard", siteUrl);
      businessIndividualUrl.searchParams.set("checkout", "success");
      businessIndividualUrl.searchParams.set("promo", "business_individual");

      return NextResponse.redirect(businessIndividualUrl.toString(), { status: 303 });
    }

    if (!selectedPriceId || (businessPlan && !businessSetupFeeWaived && !businessSetupPriceId)) {
      console.error("Checkout price configuration missing", {
        route: "/api/checkout",
        requestedPlan,
        plan,
        missingRecurringPrice: !selectedPriceId,
        missingSetupPrice: businessPlan && !businessSetupFeeWaived ? !businessSetupPriceId : false,
        setupFeeWaived: businessSetupFeeWaived
      });

      if (req.method === "GET") {
        return redirectWithParam(
          req,
          isBusinessIndividualCheckout || isBusinessIndividualExtraCardCheckout
            ? "/business-individual"
            : "/pricing",
          "checkout",
          "unavailable"
        );
      }

      return NextResponse.json(
        { error: "Checkout is temporarily unavailable for this CapturePass plan." },
        { status: 500 }
      );
    }

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

    if (profile?.stripe_customer_id && profile?.stripe_subscription_id && !isAdditionalCardsCheckout && !businessPlan) {
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

    const mode = isAdditionalCardsCheckout ? "payment" : "subscription";
    const collectsShipping = !!businessPlan || isAdditionalCardsCheckout || !!individualPlan;
    const successUrl = businessPlan && checkoutOrganization
      ? `${siteUrl}/dashboard/business?checkout=success&session_id={CHECKOUT_SESSION_ID}&org=${checkoutOrganization.id}`
      : `${siteUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      isBusinessIndividualCheckout || isBusinessIndividualExtraCardCheckout
        ? `${siteUrl}/business-individual`
        : `${siteUrl}/pricing`;
    const checkoutErrorPath =
      isBusinessIndividualCheckout || isBusinessIndividualExtraCardCheckout
        ? "/business-individual"
        : "/pricing";
    const metadataPlanKey = sessionPlanKey || "";
    const checkoutMetadata: Stripe.MetadataParam = {
      user_id: user.id,
      customer_email: user.email || "",
      plan: metadataPlanKey,
      selected_plan: metadataPlanKey
    };

    if (isBusinessIndividualCheckout) {
      checkoutMetadata.business_type = selectedBusinessType.value || "general_business";
      checkoutMetadata.checkout_type = BUSINESS_INDIVIDUAL_PLAN_KEY;
      checkoutMetadata.offer = BUSINESS_INDIVIDUAL_LAUNCH_OFFER;
      checkoutMetadata.regular_price_after = BUSINESS_INDIVIDUAL_REGULAR_PRICE_AFTER;
    }

    if (isBusinessIndividualExtraCardCheckout) {
      checkoutMetadata.checkout_type = BUSINESS_INDIVIDUAL_EXTRA_CARD_PLAN_KEY;
      checkoutMetadata.product_type = "additional_card";
    }

    if (businessPlan && checkoutOrganization) {
      checkoutMetadata.checkout_type = "business";
      checkoutMetadata.organization_id = checkoutOrganization.id;
      checkoutMetadata.business_plan_key = businessPlan.key;
      checkoutMetadata.business_plan_tier = businessPlan.tier;
      checkoutMetadata.business_billing_interval = businessBillingInterval;
      if (businessSetupFeeWaived) {
        checkoutMetadata.business_setup_fee_waived = "launch_promotion";
      }
    }

    const subscriptionMetadata: Stripe.MetadataParam = {
      user_id: user.id,
      customer_email: user.email || "",
      plan: metadataPlanKey,
      selected_plan: metadataPlanKey
    };

    if (isBusinessIndividualCheckout) {
      subscriptionMetadata.business_type = selectedBusinessType.value || "general_business";
      subscriptionMetadata.checkout_type = BUSINESS_INDIVIDUAL_PLAN_KEY;
      subscriptionMetadata.offer = BUSINESS_INDIVIDUAL_LAUNCH_OFFER;
      subscriptionMetadata.regular_price_after = BUSINESS_INDIVIDUAL_REGULAR_PRICE_AFTER;
    }

    if (businessPlan && checkoutOrganization) {
      subscriptionMetadata.checkout_type = "business";
      subscriptionMetadata.organization_id = checkoutOrganization.id;
      subscriptionMetadata.business_plan_key = businessPlan.key;
      subscriptionMetadata.business_plan_tier = businessPlan.tier;
      subscriptionMetadata.business_billing_interval = businessBillingInterval;
      if (businessSetupFeeWaived) {
        subscriptionMetadata.business_setup_fee_waived = "launch_promotion";
      }
    }

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
        // TODO: Re-enable business plan setup fee charges after 2026-07-31.
        ...(businessPlan && !businessSetupFeeWaived && businessSetupPriceId
          ? [
              {
                price: businessSetupPriceId,
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
      metadata: checkoutMetadata,
      ...(mode === "payment"
        ? {}
        : {
            subscription_data: {
              metadata: subscriptionMetadata
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
            return redirectWithParam(req, checkoutErrorPath, "checkout", "start-error");
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
          return redirectWithParam(req, checkoutErrorPath, "checkout", "start-error");
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
        return redirectWithParam(req, checkoutErrorPath, "checkout", "start-error");
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
