import { NextResponse } from "next/server";
import Stripe from "stripe";
import { businessPlanFromRecurringPriceId, getBusinessPlan, isBusinessPlanKey } from "@/lib/business/plans";
import { buildQuickChartQrUrl } from "@/lib/notifications/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationEmail } from "@/lib/notifications/send-registration-email";
import {
  getIndividualPlanKeyFromPriceId,
  normalizeIndividualPlanKey,
  resolveCheckoutPlanSelection
} from "@/lib/plans";
import { stripe } from "@/lib/stripe";

function getStringId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

function subscriptionIsActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id || null;
  const businessPlanMatch = businessPlanFromRecurringPriceId(priceId);

  if (businessPlanMatch) return businessPlanMatch.plan.key;

  const canonicalPlan = getIndividualPlanKeyFromPriceId(priceId);
  if (canonicalPlan) {
    return canonicalPlan;
  }

  const metadataPlan = subscription.metadata?.plan || subscription.metadata?.selected_plan || null;
  const selection = resolveCheckoutPlanSelection(metadataPlan);

  if (selection?.kind === "individual") {
    return selection.plan;
  }

  return normalizeIndividualPlanKey(metadataPlan);
}

function getPlanFromCheckoutSession(session: Stripe.Checkout.Session) {
  const rawPlan = session.metadata?.plan || session.metadata?.selected_plan || null;
  if (isBusinessPlanKey(rawPlan)) return rawPlan;
  return rawPlan === "additional-cards" ? rawPlan : normalizeIndividualPlanKey(rawPlan);
}

function isSubscriptionCheckoutSession(session: Stripe.Checkout.Session) {
  const plan = getPlanFromCheckoutSession(session);

  return (
    session.mode === "subscription" &&
    !!session.subscription &&
    plan !== "additional-cards"
  );
}

function planIncludesPhysicalCard(plan: string) {
  return plan === "core" || plan === "tagg_plus" || plan === "creator";
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | { id?: string } | null;
  };

  return getStringId(invoiceWithSubscription.subscription);
}

function getCheckoutShippingDetails(session?: Stripe.Checkout.Session) {
  const checkoutSession = session as
    | (Stripe.Checkout.Session & {
        shipping_details?: {
          name?: string | null;
          address?: {
            line1?: string | null;
            line2?: string | null;
            city?: string | null;
            state?: string | null;
            postal_code?: string | null;
            country?: string | null;
          } | null;
        } | null;
        collected_information?: {
          shipping_details?: {
            name?: string | null;
            address?: {
              line1?: string | null;
              line2?: string | null;
              city?: string | null;
              state?: string | null;
              postal_code?: string | null;
              country?: string | null;
            } | null;
          } | null;
        } | null;
      })
    | undefined;

  return (
    checkoutSession?.collected_information?.shipping_details ||
    checkoutSession?.shipping_details ||
    null
  );
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

async function findOrganizationIdByCustomer(customerId: string | null) {
  if (!customerId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.id || null;
}

async function updateOrganizationPlan({
  organizationId,
  customerId,
  subscriptionId,
  planKey,
  billingInterval,
  subscriptionStatus,
  setupFeePaid
}: {
  organizationId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  planKey: string;
  billingInterval?: string | null;
  subscriptionStatus?: string | null;
  setupFeePaid?: boolean;
}) {
  const businessPlan = getBusinessPlan(planKey);
  if (!businessPlan) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({
      business_plan_key: businessPlan.key,
      seat_limit: businessPlan.seatLimit,
      included_card_count: businessPlan.includedCards,
      card_allotment_total: businessPlan.includedCards,
      is_managed: businessPlan.managed,
      managed_service_enabled: businessPlan.managed,
      business_billing_interval: billingInterval || "monthly",
      stripe_customer_id: customerId || undefined,
      stripe_subscription_id: subscriptionId || undefined,
      subscription_status: subscriptionStatus || undefined,
      ...(setupFeePaid ? { setup_fee_paid_at: new Date().toISOString() } : {})
    })
    .eq("id", organizationId);

  if (error) throw error;
}

async function updateOrganizationForCheckout(session: Stripe.Checkout.Session) {
  const plan = getPlanFromCheckoutSession(session);
  const businessPlan = getBusinessPlan(plan);

  if (!businessPlan) return false;

  const organizationId = session.metadata?.organization_id || null;
  const customerId = getStringId(session.customer);
  const subscriptionId = getStringId(session.subscription);
  const billingInterval = session.metadata?.business_billing_interval || "monthly";

  if (!organizationId) {
    const userId = session.metadata?.user_id || null;
    if (userId) {
      await sendRegistrationEmail({
        userId,
        source: "stripe_checkout",
        shipping: getCheckoutShippingDetails(session)
      }).catch((registrationError) => {
        console.error("Registration email failed after business checkout activation", {
          route: "/api/webhook",
          sessionId: session.id,
          userId,
          error:
            registrationError instanceof Error
              ? registrationError.message
              : "Unknown registration email error"
        });
      });
    }

    return true;
  }

  await updateOrganizationPlan({
    organizationId,
    customerId,
    subscriptionId,
    planKey: businessPlan.key,
    billingInterval,
    subscriptionStatus: "active",
    setupFeePaid:
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required"
  });

  const userId = session.metadata?.user_id || null;
  if (userId) {
    await sendRegistrationEmail({
      userId,
      source: "stripe_checkout",
      shipping: getCheckoutShippingDetails(session)
    }).catch((registrationError) => {
      console.error("Registration email failed after business checkout activation", {
        route: "/api/webhook",
        sessionId: session.id,
        userId,
        error:
          registrationError instanceof Error
            ? registrationError.message
            : "Unknown registration email error"
      });
    });
  }

  console.info("Webhook checkout business organization updated", {
    route: "/api/webhook",
    event: "checkout.session.completed",
    sessionId: session.id,
    organizationId,
    customerId,
    subscriptionId,
    businessPlanKey: businessPlan.key
  });

  return true;
}

async function updateOrganizationForSubscription(subscription: Stripe.Subscription) {
  const plan = getPlanFromSubscription(subscription);
  const businessPlan = getBusinessPlan(plan);

  if (!businessPlan) return false;

  const customerId = getStringId(subscription.customer);
  const recurringPriceId = subscription.items?.data?.[0]?.price?.id || null;
  const businessPlanMatch = businessPlanFromRecurringPriceId(recurringPriceId);
  const billingInterval =
    subscription.metadata?.business_billing_interval ||
    businessPlanMatch?.billingInterval ||
    "monthly";
  const organizationId =
    subscription.metadata?.organization_id ||
    (await findOrganizationIdByCustomer(customerId));

  if (!organizationId) return true;

  await updateOrganizationPlan({
    organizationId,
    customerId,
    subscriptionId: subscription.id,
    planKey: businessPlan.key,
    billingInterval,
    subscriptionStatus: subscription.status
  });

  console.info("Webhook subscription business organization updated", {
    route: "/api/webhook",
    event: "customer.subscription",
    subscriptionId: subscription.id,
    organizationId,
    customerId,
    businessPlanKey: businessPlan.key,
    subscriptionStatus: subscription.status
  });

  return true;
}

async function updateOrganizationForInvoice(
  invoice: Stripe.Invoice,
  status: "active" | "past_due"
) {
  if (!getInvoiceSubscriptionId(invoice)) return false;

  const customerId = getStringId(invoice.customer);
  const organizationId = await findOrganizationIdByCustomer(customerId);

  if (!organizationId) return false;

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ subscription_status: status })
    .eq("id", organizationId);

  if (error) throw error;

  console.info("Webhook invoice business organization updated", {
    route: "/api/webhook",
    event: "invoice",
    invoiceId: invoice.id,
    organizationId,
    customerId,
    subscriptionStatus: status
  });

  return true;
}

async function sendCardNotification(userId: string, session?: Stripe.Checkout.Session) {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, full_name, slug, private_token, card_notification_sent_at")
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error || !profile || profile.card_notification_sent_at) return;

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
  const tokenUrl = profile.private_token ? `${siteUrl}/u/${profile.private_token}` : null;
  const qrUrl = buildQuickChartQrUrl(tokenUrl);

  if (!process.env.RESEND_API_KEY || !tokenUrl || !qrUrl) return;

  const checkoutSession = session as Stripe.Checkout.Session & {
    customer_details?: {
      name?: string | null;
      email?: string | null;
      address?: {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
      } | null;
    } | null;
  };

  const shippingDetails = getCheckoutShippingDetails(session);

  const customerName =
    checkoutSession?.customer_details?.name ||
    profile.full_name ||
    "—";

  const customerEmail =
    checkoutSession?.customer_details?.email ||
    profile.email ||
    "—";

  const shippingName =
    shippingDetails?.name || customerName;

  const shippingAddress =
    shippingDetails?.address ||
    checkoutSession?.customer_details?.address ||
    null;

  const shippingHtml = shippingAddress
    ? `
        <p><strong>Shipping Address:</strong><br />
          ${shippingName}<br />
          ${shippingAddress.line1 || ""}<br />
          ${shippingAddress.line2 ? `${shippingAddress.line2}<br />` : ""}
          ${shippingAddress.city || ""}${shippingAddress.city || shippingAddress.state ? ", " : ""}${shippingAddress.state || ""} ${shippingAddress.postal_code || ""}<br />
          ${shippingAddress.country || ""}
        </p>
      `
    : `
        <p><strong>Shipping Address:</strong><br />No shipping address provided.</p>
      `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TapTagg <notifications@taptagg.app>",
      to: "john@taptagg.app",
      subject: `New TapTagg card ready: ${customerName || customerEmail}`,
      html: `
        <h2>New TapTagg card ready</h2>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        ${shippingHtml}
        <p><strong>Slug:</strong> ${profile.slug || "—"}</p>
        <p><strong>Issued card URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>
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
  const plan = getPlanFromCheckoutSession(session);

  if (await updateOrganizationForCheckout(session)) {
    return;
  }

  if (!isSubscriptionCheckoutSession(session)) {
    const userId = session.metadata?.user_id || null;

    // Additional-card checkout is a one-time payment. Preserve fulfillment
    // notification behavior without mutating subscription access fields.
    if (userId) {
      await sendCardNotification(userId, session);
    }

    return;
  }

  const admin = createAdminClient();

  const userId = session.metadata?.user_id || null;
  const customerId = getStringId(session.customer);
  const subscriptionId = getStringId(session.subscription);

  if (!userId) return;

  console.info("Webhook checkout subscription activation received", {
    route: "/api/webhook",
    event: "checkout.session.completed",
    sessionId: session.id,
    userId,
    customerId,
    subscriptionId,
    plan
  });

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

  console.info("Webhook checkout profile updated", {
    route: "/api/webhook",
    event: "checkout.session.completed",
    sessionId: session.id,
    userId,
    customerId,
    subscriptionId,
    stripePlanKey: plan,
    isActive: true,
    subscriptionStatus: "active"
  });

  await sendRegistrationEmail({
    userId,
    source: "stripe_checkout",
    shipping: getCheckoutShippingDetails(session)
  }).catch((registrationError) => {
    console.error("Registration email failed after checkout activation", {
      route: "/api/webhook",
      sessionId: session.id,
      userId,
      error:
        registrationError instanceof Error
          ? registrationError.message
          : "Unknown registration email error"
    });
  });

  if (planIncludesPhysicalCard(plan)) {
    await sendCardNotification(userId, session);
  }
}

async function updateProfileForSubscription(subscription: Stripe.Subscription) {
  if (await updateOrganizationForSubscription(subscription)) {
    return;
  }

  const admin = createAdminClient();

  const customerId = getStringId(subscription.customer);
  const userId =
    subscription.metadata?.user_id ||
    (await findUserIdByCustomer(customerId));

  const plan = getPlanFromSubscription(subscription);

  if (!userId) return;

  console.info("Webhook subscription update received", {
    route: "/api/webhook",
    event: "customer.subscription",
    subscriptionId: subscription.id,
    userId,
    customerId,
    plan,
    subscriptionStatus: subscription.status
  });

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

  console.info("Webhook subscription profile updated", {
    route: "/api/webhook",
    event: "customer.subscription",
    subscriptionId: subscription.id,
    userId,
    customerId,
    stripePlanKey: plan,
    isActive: subscriptionIsActive(subscription.status),
    subscriptionStatus: subscription.status
  });
}

async function updateProfileForInvoice(
  invoice: Stripe.Invoice,
  status: "active" | "past_due"
) {
  // Invoice events can be emitted for one-time payments too; only subscription
  // invoices are allowed to affect subscription access state.
  if (!getInvoiceSubscriptionId(invoice)) return;

  if (await updateOrganizationForInvoice(invoice, status)) {
    return;
  }

  const admin = createAdminClient();

  const customerId = getStringId(invoice.customer);
  const userId = await findUserIdByCustomer(customerId);

  if (!userId) return;

  console.info("Webhook invoice subscription status update received", {
    route: "/api/webhook",
    event: "invoice",
    invoiceId: invoice.id,
    userId,
    customerId,
    status
  });

  const { error } = await admin
    .from("profiles")
    .update({
      is_active: status === "active",
      subscription_status: status,
    })
    .or(`user_id.eq.${userId},id.eq.${userId}`);

  if (error) throw error;

  console.info("Webhook invoice profile updated", {
    route: "/api/webhook",
    event: "invoice",
    invoiceId: invoice.id,
    userId,
    customerId,
    isActive: status === "active",
    subscriptionStatus: status
  });
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
