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

const PLAN_BY_PRICE_ID: Record<string, string> = {
  // Test mode prices
  price_1TQXe5DZOWbZIzsXdW6KI0DM: "essential",
  price_1TQXeQDZOWbZIzsXviMsCQli: "professional",
  price_1TQXefDZOWbZIzsXhs6jxr8N: "premium",

  // Live mode prices can be added through env vars without code changes
  ...(process.env.STRIPE_PRICE_ESSENTIAL
    ? { [process.env.STRIPE_PRICE_ESSENTIAL]: "essential" }
    : {}),
  ...(process.env.STRIPE_PRICE_PROFESSIONAL
    ? { [process.env.STRIPE_PRICE_PROFESSIONAL]: "professional" }
    : {}),
  ...(process.env.STRIPE_PRICE_PREMIUM
    ? { [process.env.STRIPE_PRICE_PREMIUM]: "premium" }
    : {})
};

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id || null;

  if (priceId && PLAN_BY_PRICE_ID[priceId]) {
    return PLAN_BY_PRICE_ID[priceId];
  }

  return subscription.metadata?.plan || subscription.metadata?.selected_plan || null;
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

async function sendCardNotification(userId: string) {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, full_name, slug, private_token, card_notification_sent_at")
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error || !profile || profile.card_notification_sent_at) return;

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://signal-pass.vercel.app").replace(/\/$/, "");
  const tokenUrl = profile.private_token ? `${siteUrl}/u/${profile.private_token}` : null;
  const qrUrl = tokenUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(tokenUrl)}&size=600`
    : null;

  if (!process.env.RESEND_API_KEY || !tokenUrl || !qrUrl) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SignalPass <notifications@signalpass.app>",
      to: "john@signalpass.app",
      subject: `New SignalPass card ready: ${profile.full_name || profile.email}`,
      html: `
        <h2>New SignalPass card ready</h2>
        <p><strong>Name:</strong> ${profile.full_name || "—"}</p>
        <p><strong>Email:</strong> ${profile.email || "—"}</p>
        <p><strong>Slug:</strong> ${profile.slug || "—"}</p>
        <p><strong>Token URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>
        <p><strong>QR image URL:</strong> <a href="${qrUrl}">${qrUrl}</a></p>
        <p><img src="${qrUrl}" alt="QR code" width="300" height="300" /></p>
      `,
    }),
  });

  await admin
    .from("profiles")
    .update({ card_notification_sent_at: new Date().toISOString() })
    .or(`user_id.eq.${userId},id.eq.${userId}`);
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
    .or(`user_id.eq.${userId},id.eq.${userId}`);

  if (error) throw error;

  await sendCardNotification(userId);
}

async function updateProfileForSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();

  const customerId = getStringId(subscription.customer);
  const userId =
    subscription.metadata?.user_id ||
    (await findUserIdByCustomer(customerId));

  const plan = getPlanFromSubscription(subscription);

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
    .or(`user_id.eq.${userId},id.eq.${userId}`);

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
    .or(`user_id.eq.${userId},id.eq.${userId}`);

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