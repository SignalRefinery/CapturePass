import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

function getStringId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

function subscriptionIsActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

async function findUserIdByCustomer(customerId: string | null) {
  if (!customerId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.user_id || null;
}

async function updateProfileForCheckout(session: Stripe.Checkout.Session) {
  const admin = createAdminClient();

  const userId = session.metadata?.user_id || null;
  const plan =
    session.metadata?.plan || session.metadata?.selected_plan || null;

  const customerId = getStringId(session.customer);
  const subscriptionId = getStringId(session.subscription);

  if (!userId) return;

  const { error } = await admin
    .from("profiles")
    .update({
      is_active: true,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_plan_key: plan,
      subscription_status: "active",
    })
    .eq("user_id", userId);

  if (error) throw error;
}

async function updateProfileForSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();

  const customerId = getStringId(subscription.customer);
  const userId =
    subscription.metadata?.user_id ||
    (await findUserIdByCustomer(customerId));

  const plan =
    subscription.metadata?.plan ||
    subscription.metadata?.selected_plan ||
    null;

  if (!userId) return;

  const { error } = await admin
    .from("profiles")
    .update({
      is_active: subscriptionIsActive(subscription.status),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_plan_key: plan,
      subscription_status: subscription.status,
    })
    .eq("user_id", userId);

  if (error) throw error;
}

async function updateProfileForInvoice(
  invoice: Stripe.Invoice,
  status: "active" | "past_due"
) {
  const admin = createAdminClient();

  const customerId = getStringId(invoice.customer);
  const userId = await findUserIdByCustomer(customerId);

  if (!userId) return;

  const { error } = await admin
    .from("profiles")
    .update({
      is_active: status === "active",
      subscription_status: status,
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Webhook signature verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await updateProfileForCheckout(
        event.data.object as Stripe.Checkout.Session
      );
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await updateProfileForSubscription(
        event.data.object as Stripe.Subscription
      );
    }

    if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_succeeded"
    ) {
      await updateProfileForInvoice(
        event.data.object as Stripe.Invoice,
        "active"
      );
    }

    if (event.type === "invoice.payment_failed") {
      await updateProfileForInvoice(
        event.data.object as Stripe.Invoice,
        "past_due"
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}