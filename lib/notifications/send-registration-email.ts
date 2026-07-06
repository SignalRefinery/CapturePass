import { getBusinessTypeLabel } from "@/lib/business-types";
import { buildEmailBrandHeaderHtml } from "@/lib/notifications/brand-header";
import { escapeEmailHtml, formatShippingAddressHtml } from "@/lib/notifications/html";
import { buildQrPngAttachment } from "@/lib/notifications/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIssuedProfileUrl, getReadableProfileUrl } from "@/lib/urls/profile-url";

type RegistrationShippingAddress = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
} | null | undefined;

function formatShippingAddress(shipping: RegistrationShippingAddress) {
  if (!shipping?.address) {
    return "<em>Shipping address not yet collected.</em>";
  }

  const parts = [
    shipping.name,
    shipping.address.line1,
    shipping.address.line2,
    [shipping.address.city, shipping.address.state, shipping.address.postal_code]
      .filter(Boolean)
      .join(", "),
    shipping.address.country
  ].filter(Boolean) as string[];

  return formatShippingAddressHtml(parts);
}

export async function sendRegistrationEmail({
  userId,
  source,
  shipping,
  force = false
}: {
  userId: string;
  source?: string | null;
  shipping?: RegistrationShippingAddress;
  force?: boolean;
}) {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "email, full_name, slug, private_token, business_type, promo_code_used, stripe_plan_key, registration_notification_sent_at"
    )
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error || !profile || (!force && profile.registration_notification_sent_at)) {
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is missing. Skipping registration email.");
    return;
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://capturepass.com"
  ).replace(/\/$/, "");

  const readableUrl = getReadableProfileUrl(profile);
  const tokenUrl = getIssuedProfileUrl(profile);
  const qrAttachment = buildQrPngAttachment(tokenUrl, profile.slug || profile.private_token);
  const qrUrl = qrAttachment?.path || "";
  const customerName = profile.full_name || "—";
  const customerEmail = profile.email || "—";
  const businessTypeLabel = getBusinessTypeLabel(profile.business_type);
  const promoCode = profile.promo_code_used || "—";
  const stripePlan = profile.stripe_plan_key || "—";
  const sourceLabel = source || "signup";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.INTERNAL_FROM_EMAIL || "CapturePass <noreply@capturepass.com>",
      to: process.env.INTERNAL_REGISTRATION_EMAIL || process.env.INTERNAL_ORDER_EMAIL || "john@capturepass.com",
      subject: `New CapturePass registration: ${customerName || customerEmail}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          ${buildEmailBrandHeaderHtml("logoLockupWithTagline")}
          <h2 style="margin:0 0 16px;">New CapturePass registration</h2>
          <p style="margin:0 0 18px;">A new profile has been created and is ready for review, fulfillment, or onboarding follow-up.</p>
          <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${escapeEmailHtml(customerName)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeEmailHtml(customerEmail)}</td></tr>
            <tr><td><strong>Business Type</strong></td><td>${escapeEmailHtml(businessTypeLabel)}</td></tr>
            <tr><td><strong>Source</strong></td><td>${escapeEmailHtml(sourceLabel)}</td></tr>
            <tr><td><strong>Promo</strong></td><td>${escapeEmailHtml(promoCode)}</td></tr>
            <tr><td><strong>Stripe Plan</strong></td><td>${escapeEmailHtml(stripePlan)}</td></tr>
            <tr><td><strong>Slug</strong></td><td>${escapeEmailHtml(profile.slug || "—")}</td></tr>
            <tr><td><strong>Readable Profile URL</strong></td><td><a href="${readableUrl}">${readableUrl}</a></td></tr>
            <tr><td><strong>Card / QR URL</strong></td><td><a href="${tokenUrl}">${tokenUrl}</a></td></tr>
            <tr><td><strong>QR image URL</strong></td><td><a href="${qrUrl}">${qrUrl}</a></td></tr>
          </table>
          <h3 style="margin:24px 0 8px;">Shipping address</h3>
          <p style="margin:0;">${formatShippingAddress(shipping)}</p>
          <p style="margin:24px 0 0;color:#555;font-size:12px;">App URL: ${escapeEmailHtml(appUrl)}</p>
          <p style="margin:12px 0 0;">
            The QR PNG is attached to this email for printing and onboarding use.
          </p>
          <p style="margin:12px 0 0;">
            <img src="${qrUrl}" alt="QR code" width="300" height="300" />
          </p>
        </div>
      `,
      attachments: qrAttachment ? [qrAttachment] : []
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to send registration email: ${errorText}`);
  }

  await admin
    .from("profiles")
    .update({ registration_notification_sent_at: new Date().toISOString() })
    .or(`user_id.eq.${userId},id.eq.${userId}`);
}
