import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const accountUrl = new URL("/account", req.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", "/account");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id, billing_exempt, lifetime_free, promo_code_used")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    accountUrl.searchParams.set("billing_error", "profile_lookup");
    return NextResponse.redirect(accountUrl, { status: 303 });
  }

  const promoCode = (profile?.promo_code_used || "").trim().toUpperCase();
  const billingIsManual =
    !!profile?.billing_exempt ||
    !!profile?.lifetime_free ||
    promoCode === "FOUNDERS";

  if (billingIsManual) {
    accountUrl.searchParams.set("billing", "manual");
    return NextResponse.redirect(accountUrl, { status: 303 });
  }

  if (!profile?.stripe_customer_id) {
    accountUrl.searchParams.set("billing_error", "missing_customer");
    return NextResponse.redirect(accountUrl, { status: 303 });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin.replace(/\/$/, "")}/account`,
    });

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    console.error("Stripe portal session creation failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown Stripe portal error"
    });
    accountUrl.searchParams.set("billing_error", "portal_unavailable");
    return NextResponse.redirect(accountUrl, { status: 303 });
  }
}
