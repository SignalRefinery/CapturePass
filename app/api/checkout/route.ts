import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  essential: process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
  "essential-monthly": process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
  "essential-annual": process.env.STRIPE_ESSENTIAL_ANNUAL_PRICE_ID,
  "additional-cards": process.env.STRIPE_ADDITIONAL_TAPTAGG_CARD_PRICE_ID
};

const SETUP_FEE_PRICE_ID = process.env.STRIPE_SETUP_FEE_PRICE_ID || null;
const SETUP_FEE_INCLUDED_PLANS = ["essential", "essential-monthly", "essential-annual"];

type CheckoutPayload = {
  plan?: string;
};

async function getPlanFromRequest(req: Request) {
  const url = new URL(req.url);
  const queryPlan = url.searchParams.get("plan");

  if (queryPlan) return queryPlan;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as CheckoutPayload;
    return body.plan || null;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.formData().catch(() => null);
    const formPlan = formData?.get("plan");
    return typeof formPlan === "string" ? formPlan : null;
  }

  return null;
}

async function createCheckoutOrPortal(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Checkout configuration missing", { route: "/api/checkout" });
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 500 });
    }

    const plan = await getPlanFromRequest(req);

    const selectedPriceId = plan ? PLAN_PRICE_MAP[plan] : undefined;

    if (!plan || !selectedPriceId) {
      return NextResponse.json(
        { error: "Missing or invalid checkout plan." },
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
      return NextResponse.json(
        { error: "Unable to verify your session. Please sign in and try again." },
        { status: 500 }
      );
    }

    if (!user) {
      const signupUrl = new URL("/signup", siteUrl);
      signupUrl.searchParams.set("plan", plan);
      signupUrl.searchParams.set("next", `/api/checkout?plan=${encodeURIComponent(plan)}`);
      return NextResponse.redirect(signupUrl.toString(), { status: 303 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, stripe_plan_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Checkout profile lookup failed", {
        route: "/api/checkout",
        userId: user.id,
        plan,
        error: profileError.message
      });
      return NextResponse.json(
        { error: "Unable to load your account for checkout. Please try again." },
        { status: 500 }
      );
    }

    const isAdditionalCardsCheckout =
      plan === "additional-cards" ||
      selectedPriceId === process.env.STRIPE_ADDITIONAL_TAPTAGG_CARD_PRICE_ID;

    if (profile?.stripe_customer_id && !isAdditionalCardsCheckout) {
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
        return NextResponse.json({ error: "Unable to open billing management. Please try again." }, { status: 500 });
      }

      return NextResponse.redirect(portal.url, { status: 303 });
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: isAdditionalCardsCheckout ? "payment" : "subscription",
        ...(profile?.stripe_customer_id
          ? { customer: profile.stripe_customer_id }
          : { customer_email: user.email || undefined }),
        shipping_address_collection: {
          allowed_countries: ["US"]
        },
        billing_address_collection: "required",
        line_items: [
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
        success_url: `${siteUrl}/dashboard`,
        cancel_url: `${siteUrl}/pricing`,
        metadata: {
          user_id: user.id,
          plan,
          selected_plan: plan
        },
        ...(isAdditionalCardsCheckout
          ? {}
          : {
              subscription_data: {
                metadata: {
                  user_id: user.id,
                  plan,
                  selected_plan: plan
                }
              }
            })
      });
    } catch (error) {
      console.error("Checkout session creation failed", {
        route: "/api/checkout",
        userId: user.id,
        plan,
        mode: isAdditionalCardsCheckout ? "payment" : "subscription",
        hasCustomerId: !!profile?.stripe_customer_id,
        error: error instanceof Error ? error.message : "Unknown Stripe checkout error"
      });
      return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
    }

    if (!session.url) {
      console.error("Checkout session missing redirect URL", {
        route: "/api/checkout",
        userId: user.id,
        plan,
        sessionId: session.id
      });
      return NextResponse.json(
        { error: "Unable to start checkout. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown checkout error";
    console.error("Checkout request failed", {
      route: "/api/checkout",
      error: message
    });
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
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin
  ).replace(/\/$/, "");
}
