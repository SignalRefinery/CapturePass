import { getBusinessTypeLabel } from "@/lib/business-types";
import { buildEmailBrandHeaderHtml } from "@/lib/notifications/brand-header";
import { escapeEmailHtml } from "@/lib/notifications/html";
import { buildQrPngAttachment } from "@/lib/notifications/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIssuedProfileUrl, getReadableProfileUrl } from "@/lib/urls/profile-url";

type SendBusinessIndividualLogoEmailOptions = {
  brandLogoUrl?: string | null;
  profileId: string;
};

export async function sendBusinessIndividualLogoEmail({
  brandLogoUrl,
  profileId
}: SendBusinessIndividualLogoEmailOptions) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is missing. Skipping Business Individual business logo email.");
    return;
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, full_name, slug, private_token, business_type, promo_code_used, stripe_plan_key, brand_logo_url")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !profile) {
    console.warn("Business Individual business logo email skipped because profile lookup failed.", {
      profileId,
      error: error?.message || null
    });
    return;
  }

  const logoUrl = brandLogoUrl || profile.brand_logo_url;
  if (!logoUrl) return;

  const readableUrl = getReadableProfileUrl(profile);
  const tokenUrl = getIssuedProfileUrl(profile);
  const qrAttachment = buildQrPngAttachment(tokenUrl, profile.slug || profile.private_token);
  const qrUrl = qrAttachment?.path || "";
  const customerName = profile.full_name || "—";
  const customerEmail = profile.email || "—";
  const businessTypeLabel = getBusinessTypeLabel(profile.business_type);
  const promoCode = profile.promo_code_used || "—";
  const stripePlan = profile.stripe_plan_key || "—";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.INTERNAL_FROM_EMAIL || "CapturePass <noreply@capturepass.com>",
      to: process.env.INTERNAL_ORDER_EMAIL || process.env.INTERNAL_REGISTRATION_EMAIL || "john@capturepass.com",
      subject: `Business logo uploaded: ${customerName || customerEmail}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          ${buildEmailBrandHeaderHtml("logoLockup")}
          <h2 style="margin:0 0 16px;">Business logo uploaded</h2>
          <p style="margin:0 0 18px;">A Business Individual customer uploaded a business logo for card/profile fulfillment.</p>
          <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${escapeEmailHtml(customerName)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeEmailHtml(customerEmail)}</td></tr>
            <tr><td><strong>Business Type</strong></td><td>${escapeEmailHtml(businessTypeLabel)}</td></tr>
            <tr><td><strong>Promo</strong></td><td>${escapeEmailHtml(promoCode)}</td></tr>
            <tr><td><strong>Stripe Plan</strong></td><td>${escapeEmailHtml(stripePlan)}</td></tr>
            <tr><td><strong>Slug</strong></td><td>${escapeEmailHtml(profile.slug || "—")}</td></tr>
            <tr><td><strong>Readable Profile URL</strong></td><td><a href="${readableUrl}">${readableUrl}</a></td></tr>
            <tr><td><strong>Card / QR URL</strong></td><td><a href="${tokenUrl}">${tokenUrl}</a></td></tr>
            <tr><td><strong>QR image URL</strong></td><td><a href="${qrUrl}">${qrUrl}</a></td></tr>
            <tr><td><strong>Logo URL</strong></td><td><a href="${escapeEmailHtml(logoUrl)}">${escapeEmailHtml(logoUrl)}</a></td></tr>
          </table>
          <p style="margin:24px 0 8px;"><strong>Logo preview</strong></p>
          <p style="margin:0;"><img src="${escapeEmailHtml(logoUrl)}" alt="Business logo" style="max-width:420px;width:100%;height:auto;" /></p>
          <p style="margin:24px 0 0;">
            The QR PNG is attached to this email for matching this logo to the issued card/profile assets.
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
    throw new Error(`Unable to send Business Individual business logo email: ${errorText}`);
  }
}
