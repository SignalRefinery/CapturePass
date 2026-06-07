import { getBusinessTypeLabel } from "@/lib/business-types";
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

  if (!parts.length) {
    return "<em>Shipping address not yet collected.</em>";
  }

  return parts.map((part) => escapeHtml(part)).join("<br />");
}

export async function sendRegistrationEmail({
  userId,
  source,
  shipping
}: {
  userId: string;
  source?: string | null;
  shipping?: RegistrationShippingAddress;
}) {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "email, full_name, slug, private_token, business_type, promo_code_used, stripe_plan_key, registration_notification_sent_at"
    )
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error || !profile || profile.registration_notification_sent_at) {
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
    "https://taptagg.app"
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
      from: process.env.INTERNAL_FROM_EMAIL || "TapTagg <noreply@taptagg.app>",
      to: process.env.INTERNAL_REGISTRATION_EMAIL || process.env.INTERNAL_ORDER_EMAIL || "john@taptagg.app",
      subject: `New TapTagg registration: ${customerName || customerEmail}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2 style="margin:0 0 16px;">New TapTagg registration</h2>
          <p style="margin:0 0 18px;">A new profile has been created and is ready for review, fulfillment, or onboarding follow-up.</p>
          <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${escapeHtml(customerName)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeHtml(customerEmail)}</td></tr>
            <tr><td><strong>Business Type</strong></td><td>${escapeHtml(businessTypeLabel)}</td></tr>
            <tr><td><strong>Source</strong></td><td>${escapeHtml(sourceLabel)}</td></tr>
            <tr><td><strong>Promo</strong></td><td>${escapeHtml(promoCode)}</td></tr>
            <tr><td><strong>Stripe Plan</strong></td><td>${escapeHtml(stripePlan)}</td></tr>
            <tr><td><strong>Slug</strong></td><td>${escapeHtml(profile.slug || "—")}</td></tr>
            <tr><td><strong>Readable Profile URL</strong></td><td><a href="${readableUrl}">${readableUrl}</a></td></tr>
            <tr><td><strong>NFC source URL</strong></td><td><a href="${tokenUrl}">${tokenUrl}</a></td></tr>
            <tr><td><strong>QR image URL</strong></td><td><a href="${qrUrl}">${qrUrl}</a></td></tr>
          </table>
          <h3 style="margin:24px 0 8px;">Shipping address</h3>
          <p style="margin:0;">${formatShippingAddress(shipping)}</p>
          <p style="margin:24px 0 0;color:#555;font-size:12px;">App URL: ${escapeHtml(appUrl)}</p>
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
