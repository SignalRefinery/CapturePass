import { isTapTaggBootstrapAdminEmail } from "@/lib/auth/admin";
import { normalizeThemeKey, isHexColor } from "@/lib/themes";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPlatformAdminEmail(email?: string | null) {
  return isTapTaggBootstrapAdminEmail(email);
}

export function isPlatformAdminMember(member?: { email?: string | null } | null) {
  return isPlatformAdminEmail(member?.email);
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://capturepass.com").replace(/\/$/, "");
}

export function cleanHexColor(value: FormDataEntryValue | null) {
  const color = String(value || "").trim();
  return isHexColor(color) ? color : null;
}

export function cleanBrandTheme(value: FormDataEntryValue | null) {
  const theme = normalizeThemeKey(String(value || ""));
  if (theme === "clean_horizon" || theme === "sage_professional") return "clean_light";
  if (theme === "custom") return "custom";
  return "deep_brand";
}

export function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim() || null;
}

export function cleanId(value: FormDataEntryValue | string | null | undefined) {
  const id = String(value || "").trim();
  return UUID_PATTERN.test(id) ? id : "";
}

export function cleanOptionalId(value: FormDataEntryValue | string | null | undefined) {
  return cleanId(value) || null;
}

export function cleanEmail(value: FormDataEntryValue | string | null | undefined) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function cleanLocationState(value: FormDataEntryValue | string | null | undefined) {
  const state = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(state) ? state : null;
}

export function cleanTokenStatus(value: FormDataEntryValue | string | null | undefined) {
  const status = String(value || "").trim();
  return status === "active" || status === "unassigned" || status === "inactive" ? status : "inactive";
}

export function cleanStateCodes(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
}

export function cleanUrl(value: FormDataEntryValue | null) {
  const url = String(value || "").trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function businessErrorMessage(error?: string) {
  switch (error) {
    case "branding_save_failed":
      return "Branding did not save. Confirm the business branding Supabase SQL has been run, then try again.";
    case "business_links_save_failed":
      return "Colors and logo saved, but business links did not. Run phase72_business_global_links.sql in Supabase, then save again.";
    case "logo_too_large":
      return "Business logo must be 5 MB or smaller.";
    case "logo_must_be_png":
      return "Business logo must be a PNG file.";
    case "logo_upload_failed":
      return "Business logo could not be uploaded. Confirm phase80_business_asset_uploads.sql has been run in Supabase.";
    case "headshot_too_large":
      return "Employee headshot must be 2 MB or smaller.";
    case "headshot_invalid_type":
      return "Employee headshot must be a JPG, PNG, or WebP image.";
    case "headshot_upload_failed":
      return "Employee headshot could not be uploaded. Confirm phase80_business_asset_uploads.sql has been run in Supabase.";
    case "missing_member_email":
      return "That person needs an email address before a login invite can be sent.";
    case "member_email_failed":
      return "The member email could not be updated. Check the address and try again.";
    case "member_profile_failed":
      return "The member profile could not be updated. Check the name, phone, and email, then try again.";
    case "location_name_required":
      return "Location name is required.";
    case "region_name_required":
      return "Region name is required.";
    case "location_save_failed":
      return "The location could not be saved. Please try again.";
    case "region_save_failed":
      return "The region could not be saved. Please try again.";
    case "business_invite_send_failed":
      return "The login invite could not be sent. Check Supabase Auth email settings, allowed redirect URLs, and the member email address.";
    case "digital_pass_send_failed":
      return "Digital pass email could not be sent. Confirm the employee has an active assigned token and email address, then try again.";
    case "webhook_save_failed":
      return "Webhook settings could not be saved. Check the webhook URL and try again.";
    case "webhook_secret_failed":
      return "Webhook secret could not be regenerated. Please try again.";
    case "webhook_url_required":
      return "Webhook URL is required when webhooks are enabled.";
    case "business_type_save_failed":
      return "Business type could not be saved. Please try again.";
    case "cannot_remove_self":
      return "You cannot archive or delete your own active admin access from this table.";
    case "member_delete_failed":
      return "That business user could not be deleted. Try archiving them instead.";
    case "platform_admin_locked":
      return "Platform admin access is locked and cannot be changed from the business user table.";
    case "missing_org_name":
      return "Company name is required.";
    case "missing_admin_name":
      return "Business admin name is required.";
    case "missing_employee_name":
      return "Employee name is required.";
    case "invalid_business_action":
      return "That business action was missing required details. Refresh and try again.";
    default:
      return "Please complete the required business fields and try again.";
  }
}

export function tokenUrl(token: string) {
  return `${appUrl()}/p/${token}`;
}

export function digitalPassUrl(token: string) {
  return `${appUrl()}/pass/business/${token}`;
}

export function passVcardUrl(token: string) {
  return `${appUrl()}/api/pass-vcard/${token}`;
}

export function escapeHtml(value?: string | null) {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function businessLoginPath(slug?: string | null) {
  return slug ? `/${slug}/login` : "/dashboard/business";
}

export function businessLoginUrl(slug?: string | null) {
  return `${appUrl()}${businessLoginPath(slug)}`;
}

export function businessLocationUrl(organizationSlug?: string | null, locationSlug?: string | null) {
  if (!organizationSlug || !locationSlug) return null;
  return `${appUrl()}/business/${organizationSlug}/${locationSlug}`;
}

export function businessInviteRedirectUrl(slug?: string | null) {
  const passwordUrl = new URL("/update-password", appUrl());
  passwordUrl.searchParams.set("next", businessLoginPath(slug));
  return passwordUrl.toString();
}
