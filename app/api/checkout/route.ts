import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

const PLAN_PRICE_MAP: Record<string, string> = {
  essential: "price_1TJiBoDZOWbZIzsXmQCHNoe0",
  professional: "price_1TJiBsDZOWbZIzsXVvd6mKcC",
  premium: "price_1TJiBmDZOWbZIzsXqrkBALau"
};

const SETUP_FEE_PRICE_ID = "price_1TJiBsDZOWbZIzsXVMrTqZqV";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plan = url.searchParams.get("plan");

    if (!plan || !PLAN_PRICE_MAP[plan]) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: "Supabase getUser failed", details: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.redirect(new URL("/signup", req.url));
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, stripe_plan_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Profile lookup failed", details: profileError.message }, { status: 500 });
    }

    if (profile?.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${siteUrl}/account`
      });

      return NextResponse.redirect(portal.url);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email || undefined,
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
        selected_plan: plan
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          selected_plan: plan
        }
      }
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown checkout error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}