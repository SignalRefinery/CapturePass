export type AdminUserUpdateField =
  | "full_name"
  | "email"
  | "slug"
  | "role_line"
  | "intro"
  | "phone"
  | "website_url"
  | "primary_link_1_title"
  | "primary_link_2_title"
  | "primary_link_3_title"
  | "primary_link_4_title"
  | "primary_link_1_url"
  | "primary_link_2_url"
  | "primary_link_3_url"
  | "primary_link_4_url"
  | "primary_link_1_type"
  | "primary_link_2_type"
  | "primary_link_3_type"
  | "primary_link_4_type"
  | "primary_link_1"
  | "primary_link_2"
  | "primary_link_3"
  | "primary_link_4"
  | "promo_code_used"
  | "consent_public_visibility"
  | "is_active"
  | "billing_exempt"
  | "is_affiliate"
  | "is_public_official"
  | "affiliate_tier"
  | "referral_code"
  | "stripe_plan_key"
  | "subscription_status"
  | "slug_status";

export type AdminUserUpdateRequest = {
  userId: string;
  field: AdminUserUpdateField;
  value: string;
  overrideRestrictedSlug: boolean;
};

const ADMIN_UPDATE_FIELDS = new Set<AdminUserUpdateField>([
  "full_name",
  "email",
  "slug",
  "role_line",
  "intro",
  "phone",
  "website_url",
  "primary_link_1_title",
  "primary_link_2_title",
  "primary_link_3_title",
  "primary_link_4_title",
  "primary_link_1_url",
  "primary_link_2_url",
  "primary_link_3_url",
  "primary_link_4_url",
  "primary_link_1_type",
  "primary_link_2_type",
  "primary_link_3_type",
  "primary_link_4_type",
  "primary_link_1",
  "primary_link_2",
  "primary_link_3",
  "primary_link_4",
  "promo_code_used",
  "consent_public_visibility",
  "is_active",
  "billing_exempt",
  "is_affiliate",
  "is_public_official",
  "affiliate_tier",
  "referral_code",
  "stripe_plan_key",
  "subscription_status",
  "slug_status"
]);

const ALLOWED_BODY_KEYS = new Set(["userId", "field", "value", "overrideRestrictedSlug"]);

export const ALLOWED_AFFILIATE_TIERS = new Set(["standard", "founder", "partner"]);

export const ALLOWED_BOOLEAN_FIELDS = new Set([
  "consent_public_visibility",
  "is_active",
  "billing_exempt",
  "is_affiliate",
  "is_public_official"
]);

function isAdminUserUpdateField(value: string): value is AdminUserUpdateField {
  return ADMIN_UPDATE_FIELDS.has(value as AdminUserUpdateField);
}

export function isKnownPlanOverride(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return [
    "free",
    "reserved",
    "reserved-tagg",
    "reserved_tagg",
    "digital",
    "digital-monthly",
    "digital_monthly",
    "core",
    "essential",
    "essential-monthly",
    "essential-annual",
    "tagg_plus",
    "tagg-plus",
    "taggplus",
    "professional",
    "creator",
    "premium",
    "founder",
    "business",
    "business_starter_self",
    "business_starter_managed",
    "business_growth_self",
    "business_growth_managed",
    "business_pro_self",
    "business_pro_managed",
    "enterprise",
    "team"
  ].includes(normalized);
}

export function parseBooleanField(value: string) {
  return value === "true" || value === "1" || value === "on";
}

export function parseAdminUserUpdateRequest(body: unknown): AdminUserUpdateRequest | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const raw = body as Record<string, unknown>;
  if (!Object.keys(raw).every((key) => ALLOWED_BODY_KEYS.has(key))) {
    return null;
  }

  const userId = typeof raw.userId === "string" ? raw.userId.trim() : "";
  const field = typeof raw.field === "string" ? raw.field.trim() : "";
  const value = typeof raw.value === "string" ? raw.value : "";
  const overrideRestrictedSlug = parseBooleanField(
    typeof raw.overrideRestrictedSlug === "string"
      ? raw.overrideRestrictedSlug
      : raw.overrideRestrictedSlug === true
        ? "true"
        : ""
  );

  if (!userId || !field || !isAdminUserUpdateField(field)) {
    return null;
  }

  return {
    userId,
    field,
    value,
    overrideRestrictedSlug
  };
}
