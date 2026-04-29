import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

const PLAN_PRICE_MAP: Record<string, string> = {
  essential: "price_1TQXe5DZOWbZIzsXdW6KI0DM",
  professional: "price_1TQXeQDZOWbZIzsXviMsCQli",
  premium: "price_1TQXefDZOWbZIzsXhs6jxr8N"
};

const SETUP_FEE_PRICE_ID = "price_1TQXexDZOWbZIzsXqVwzapoI";

type CheckoutPayload = {
  plan?: string;
};

function getSiteUrl(req: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin
  ).replace(/\/$/, "");
}

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
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const plan = await getPlanFromRequest(req);

    if (!plan || !PLAN_PRICE_MAP[plan]) {
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

    if (userError) {
      return NextResponse.json(
        { error: "Supabase getUser failed", details: userError.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "You must be logged in before checkout." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, stripe_plan_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Profile lookup failed", details: profileError.message },
        { status: 500 }
      );
    }

    if (profile?.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${siteUrl}/account`
      });

      return NextResponse.redirect(portal.url, { status: 303 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email || undefined,
      shipping_address_collection: {
        allowed_countries: ["US"]
      },
      billing_address_collection: "required",
      line_items: [
        {
          price: SETUP_FEE_PRICE_ID,
          quantity: 1
        },
        {
          price: PLAN_PRICE_MAP[plan],
          quantity: 1
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
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          selected_plan: plan
        }
      }
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe checkout session did not return a URL." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return createCheckoutOrPortal(req);
}

export async function GET(req: Request) {
  return createCheckoutOrPortal(req);
}