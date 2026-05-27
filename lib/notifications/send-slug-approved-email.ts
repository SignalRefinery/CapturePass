import { getIssuedProfileUrl, getReadableProfileUrl } from "@/lib/urls/profile-url";

type ProfileForEmail = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  slug?: string | null;
  private_token?: string | null;
  stripe_plan_key?: string | null;
  affiliate_tier?: string | null;
  is_affiliate?: boolean | null;
  shipping_name?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shippingHtml(profile: ProfileForEmail) {
  const parts = [
    profile.shipping_name,
    profile.shipping_address_line1,
    profile.shipping_address_line2,
    [profile.shipping_city, profile.shipping_state, profile.shipping_postal_code]
      .filter(Boolean)
      .join(", "),
    profile.shipping_country
  ].filter(Boolean) as string[];

  if (parts.length === 0) {
    return "<em>Shipping address not yet collected.</em>";
  }

  return parts.map((part) => escapeHtml(part)).join("<br />");
}

export async function sendSlugApprovedEmail(profile: ProfileForEmail) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is missing. Skipping slug-approved email.");
    return;
  }

  const to = process.env.INTERNAL_ORDER_EMAIL || "hello@taptagg.app";
  const issuedUrl = getIssuedProfileUrl(profile);
  const readableUrl = getReadableProfileUrl(profile);

  const subject = `Profile issued: ${profile.slug || profile.private_token || "unknown-profile"}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin:0 0 16px;">TapTagg profile approved</h2>
      <p style="margin:0 0 18px;">
        This profile is approved and ready for fulfillment. Issued QR and NFC materials should use the issued card URL below.
      </p>

      <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr><td><strong>Customer</strong></td><td>${escapeHtml(profile.full_name || "")}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(profile.email || "")}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${escapeHtml(profile.phone || "")}</td></tr>
        <tr><td><strong>Readable profile URL</strong></td><td>${escapeHtml(readableUrl)}</td></tr>
        <tr><td><strong>Issued card URL</strong></td><td>${escapeHtml(issuedUrl)}</td></tr>
        <tr><td><strong>QR destination</strong></td><td>${escapeHtml(issuedUrl)}</td></tr>
        <tr><td><strong>Plan</strong></td><td>${escapeHtml(profile.stripe_plan_key || "Not set")}</td></tr>
        <tr><td><strong>Affiliate</strong></td><td>${profile.is_affiliate ? escapeHtml(profile.affiliate_tier || "affiliate") : "No"}</td></tr>
      </table>

      <h3 style="margin:24px 0 8px;">Shipping address</h3>
      <p style="margin:0;">${shippingHtml(profile)}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.INTERNAL_FROM_EMAIL || "TapTagg <noreply@taptagg.app>",
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to send slug-approved email: ${errorText}`);
  }
}
