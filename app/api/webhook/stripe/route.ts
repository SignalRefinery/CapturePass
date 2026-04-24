import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

export async function POST(req: Request) {
  const body = await req.text();
const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = await createClient();

  try {
    // 🔥 CHECKOUT COMPLETED
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const plan = session.metadata?.selected_plan;

      if (!userId) return NextResponse.json({ received: true });

      await supabase
        .from("profiles")
        .update({
          stripe_customer_id: session.customer as string,
          stripe_plan_key: plan,
          subscription_status: "active"
        })
        .eq("user_id", userId);
    }

    // 🔁 SUBSCRIPTION CREATED / UPDATED
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;

      const customerId = sub.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (!profile) return NextResponse.json({ received: true });

      await supabase
        .from("profiles")
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: sub.status
        })
        .eq("user_id", profile.user_id);
    }

    // ❌ SUBSCRIPTION CANCELED
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      const customerId = sub.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (!profile) return NextResponse.json({ received: true });

      await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled"
        })
        .eq("user_id", profile.user_id);
    }

    // 💳 PAYMENT FAILED
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId = invoice.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (!profile) return NextResponse.json({ received: true });

      await supabase
        .from("profiles")
        .update({
          subscription_status: "past_due"
        })
        .eq("user_id", profile.user_id);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return new NextResponse(`Webhook handler failed: ${err.message}`, {
      status: 500
    });
  }
}