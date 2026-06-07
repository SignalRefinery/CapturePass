import type { ProfileRecord } from "@/lib/types";
import { getBusinessPlan, type BusinessPlanConfig } from "@/lib/business/plans";
import { isRealEstateBusiness } from "@/lib/business-types";

export type PlanKey = "free" | "core" | "tagg_plus" | "creator";

export type PlanFeatures = {
  key: PlanKey;
  label: string;
  isActivated: boolean;
  hasDigitalProfile: boolean;
  hasNfcSharing: boolean;
  hasQrSharing: boolean;
  hasExpandedLinks: boolean;
  hasBasicThemes: boolean;
  hasAdvancedCustomization: boolean;
  hasBasicAnalytics: boolean;
  hasContactSharing: boolean;
  hasContactsDashboard: boolean;
  hasLeadCapture: boolean;
  hasCustomButtons: boolean;
  hasPrioritySupport: boolean;
  hasAdvancedAnalytics: boolean;
  hasMoreProfileSections: boolean;
  hasEmbeds: boolean;
  hasBookingLinks: boolean;
  hasSmartRedirects: boolean;
  hasContactExport: boolean;
};

export type CheckoutPlanSelection =
  | { kind: "individual"; plan: PlanKey }
  | { kind: "business"; plan: BusinessPlanConfig }
  | { kind: "additional_cards" };

const PLAN_ORDER: Record<PlanKey, number> = {
  free: 0,
  core: 1,
  tagg_plus: 2,
  creator: 3
};

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  core: "Core",
  tagg_plus: "Tagg+",
  creator: "Creator"
};

const LEGACY_INDIVIDUAL_PLAN_ALIASES: Record<string, PlanKey> = {
  "": "free",
  free: "free",
  reserved: "free",
  "reserved-tagg": "free",
  "reserved_tagg": "free",
  digital: "core",
  "digital-monthly": "core",
  "digital_monthly": "core",
  core: "core",
  essential: "core",
  "essential-monthly": "core",
  "essential_annual": "core",
  "essential-annual": "core",
  pro: "tagg_plus",
  tagg_plus: "tagg_plus",
  "tagg-plus": "tagg_plus",
  taggplus: "tagg_plus",
  professional: "tagg_plus",
  creator: "creator",
  premium: "creator",
  founder: "creator",
  business: "creator",
  business_starter_self: "core",
  business_starter_managed: "core",
  business_growth_self: "tagg_plus",
  business_growth_managed: "tagg_plus",
  business_pro_self: "creator",
  business_pro_managed: "creator",
  enterprise: "creator",
  team: "creator"
};

const CHECKOUT_INDIVIDUAL_PLAN_ALIASES: Record<string, PlanKey> = {
  digital: "core",
  "digital-monthly": "core",
  "digital_monthly": "core",
  core: "core",
  essential: "core",
  "essential-monthly": "core",
  "essential_annual": "core",
  "essential-annual": "core",
  pro: "tagg_plus",
  tagg_plus: "tagg_plus",
  "tagg-plus": "tagg_plus",
  taggplus: "tagg_plus",
  professional: "tagg_plus",
  creator: "creator",
  premium: "creator"
};

const INDIVIDUAL_PLAN_PRICE_ENV: Record<PlanKey, string | null> = {
  free: null,
  core:
    process.env.STRIPE_CORE_PRICE_ID ||
    process.env.STRIPE_DIGITAL_PRICE_ID ||
    null,
  tagg_plus: process.env.STRIPE_TAGG_PLUS_PRICE_ID || null,
  creator: process.env.STRIPE_CREATOR_PRICE_ID || null
};

function normalizePlanInput(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

export function normalizeIndividualPlanKey(value?: string | null): PlanKey {
  return normalizeLegacyIndividualPlanKey(value);
}

export function normalizePlanKey(value?: string | null): PlanKey {
  return normalizeIndividualPlanKey(value);
}

export function normalizeLegacyIndividualPlanKey(value?: string | null): PlanKey {
  const normalized = normalizePlanInput(value);
  return LEGACY_INDIVIDUAL_PLAN_ALIASES[normalized] || "free";
}

export function isPlanActive(plan: PlanKey | string | null | undefined, isActivated = true) {
  return isActivated && normalizeIndividualPlanKey(plan) !== "free";
}

export function planAtLeast(plan: PlanKey, minimum: Exclude<PlanKey, "free">) {
  return PLAN_ORDER[plan] >= PLAN_ORDER[minimum];
}

export function planUnlocksTaggPlusFeatures(
  plan: PlanKey | string | null | undefined,
  isActivated = true
) {
  const normalized = normalizeIndividualPlanKey(plan);
  return isActivated && planAtLeast(normalized, "tagg_plus");
}

export function planUnlocksCreatorFeatures(
  plan: PlanKey | string | null | undefined,
  isActivated = true
) {
  const normalized = normalizeIndividualPlanKey(plan);
  return isActivated && planAtLeast(normalized, "creator");
}

export function getPlanDisplayLabel(plan: PlanKey | string | null | undefined) {
  return PLAN_LABELS[normalizeIndividualPlanKey(plan)];
}

export function getPlanPricingDescription(
  plan: PlanKey | string | null | undefined,
  options?: {
    isActivated?: boolean;
    manualBilling?: boolean;
    legacySourcePlan?: string | null;
    billingInterval?: "monthly" | "annual" | null;
    subscriptionStatus?: string | null;
  }
) {
  const normalized = normalizeIndividualPlanKey(plan);
  const legacySource = normalizePlanInput(options?.legacySourcePlan);
  const isActivated = options?.isActivated ?? true;

  if (options?.manualBilling) {
    return "Founder or manually granted access.";
  }

  if (!isActivated || normalized === "free") {
    return "Not activated yet.";
  }

  if (normalized === "core") {
    if (legacySource === "digital" || legacySource === "digital-monthly" || legacySource === "digital_monthly") {
      return "Legacy digital subscription, now treated as Core access.";
    }

    return "Physical card activated. No renewal required.";
  }

  if (options?.billingInterval === "monthly") {
    return "Monthly subscription.";
  }

  if (options?.subscriptionStatus === "trialing") {
    return "Subscription in trial.";
  }

  return "Annual subscription.";
}

export function getIndividualPlanPriceId(plan: PlanKey) {
  return INDIVIDUAL_PLAN_PRICE_ENV[plan];
}

export function getIndividualPlanKeyFromPriceId(priceId?: string | null) {
  if (!priceId) return null;

  if (
    INDIVIDUAL_PLAN_PRICE_ENV.core === priceId ||
    process.env.STRIPE_DIGITAL_PRICE_ID === priceId
  ) {
    return "core" as const;
  }

  if (INDIVIDUAL_PLAN_PRICE_ENV.tagg_plus === priceId) {
    return "tagg_plus" as const;
  }

  if (INDIVIDUAL_PLAN_PRICE_ENV.creator === priceId) {
    return "creator" as const;
  }

  return null;
}

export function resolveCheckoutPlanSelection(value?: string | null): CheckoutPlanSelection | null {
  const normalized = normalizePlanInput(value);

  if (!normalized) {
    return null;
  }

  if (normalized === "additional-cards") {
    return { kind: "additional_cards" };
  }

  const businessPlan = getBusinessPlan(normalized);
  if (businessPlan) {
    return { kind: "business", plan: businessPlan };
  }

  if (!Object.prototype.hasOwnProperty.call(CHECKOUT_INDIVIDUAL_PLAN_ALIASES, normalized)) {
    return null;
  }

  return { kind: "individual", plan: CHECKOUT_INDIVIDUAL_PLAN_ALIASES[normalized] };
}

export function getPlanFeatures(
  plan: PlanKey,
  isActivated = false,
  profileBusinessType?: string | null
): PlanFeatures {
  const hasPaidAccess = isActivated && plan !== "free";
  const isCore = isActivated && planAtLeast(plan, "core");
  const isTaggPlus = isActivated && planAtLeast(plan, "tagg_plus");
  const isCreator = isActivated && planAtLeast(plan, "creator");
  const hasMultipleViews = isCreator || isRealEstateBusiness(profileBusinessType);

  return {
    key: plan,
    label: getPlanDisplayLabel(plan),
    isActivated,
    hasDigitalProfile: hasPaidAccess,
    hasNfcSharing: isCore,
    hasQrSharing: hasPaidAccess,
    hasExpandedLinks: hasPaidAccess,
    hasBasicThemes: isCore,
    hasAdvancedCustomization: isTaggPlus || isCreator,
    hasBasicAnalytics: isTaggPlus || isCreator,
    hasContactSharing: hasPaidAccess,
    hasContactsDashboard: hasPaidAccess,
    hasLeadCapture: hasPaidAccess,
    hasCustomButtons: isTaggPlus || isCreator,
    hasPrioritySupport: isTaggPlus || isCreator,
    hasAdvancedAnalytics: isCreator,
    hasMoreProfileSections: hasMultipleViews,
    hasEmbeds: isCreator,
    hasBookingLinks: isCreator,
    hasSmartRedirects: isCreator,
    hasContactExport: hasPaidAccess
  };
}

export function getProfilePlan(profile?: ProfileRecord | null): PlanFeatures {
  const promoCode = (profile?.promo_code_used || "").trim().toUpperCase();
  const manualActivation =
    !!profile?.billing_exempt ||
    !!profile?.lifetime_free ||
    promoCode === "FOUNDERS" ||
    !!profile?.is_admin;
  const storedPlan = manualActivation
    ? profile?.stripe_plan_key || "creator"
    : profile?.is_active
      ? profile?.stripe_plan_key || "core"
      : profile?.stripe_plan_key;
  const plan = normalizeIndividualPlanKey(storedPlan);
  const isActivated = manualActivation || !!profile?.is_active;
  const accessPlan = isActivated ? plan : "free";

  // Plan gating lives here so pricing changes can be made in one place.
  // `is_active` controls paid/manual activation; inactive paid plans fall back
  // to Free so failed or canceled subscriptions cannot keep paid access.
  return getPlanFeatures(accessPlan, isActivated, profile?.business_type);
}

export function applyFounderAccess(
  profile?: ProfileRecord | null,
  promoCode?: string | null
): ProfileRecord | null {
  if (!profile) {
    return null;
  }

  const normalizedPromo = (promoCode || profile.promo_code_used || "").trim().toUpperCase();

  if (normalizedPromo !== "FOUNDERS") {
    return profile;
  }

  return {
    ...profile,
    promo_code_used: "FOUNDERS",
    billing_exempt: true,
    lifetime_free: true,
    is_active: true,
    stripe_plan_key: "creator",
    subscription_status: profile.subscription_status || "active"
  };
}

export function profileCanRenderPublicly(profile?: ProfileRecord | null) {
  return !!profile && canUseDigitalProfile(getProfilePlan(profile));
}

export function canUseDigitalProfile(plan: PlanFeatures) {
  return plan.hasDigitalProfile;
}

export function canUseQR(plan: PlanFeatures) {
  return plan.hasQrSharing;
}

export function canUseNFC(plan: PlanFeatures) {
  return plan.hasNfcSharing;
}

export function canUseContactSharing(plan: PlanFeatures) {
  return plan.hasContactSharing;
}

export function canUseContactsDashboard(plan: PlanFeatures) {
  return plan.hasContactsDashboard;
}

export function canUseAnalytics(plan: PlanFeatures) {
  return plan.hasBasicAnalytics;
}

export function canUseAdvancedCustomization(plan: PlanFeatures) {
  return plan.hasAdvancedCustomization;
}

export function canUseCustomButtons(plan: PlanFeatures) {
  return plan.hasCustomButtons;
}

export function canUseMultiViews(plan: PlanFeatures) {
  return plan.hasMoreProfileSections;
}
