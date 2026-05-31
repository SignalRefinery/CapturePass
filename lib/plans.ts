import type { ProfileRecord } from "@/lib/types";

export type PlanKey = "free" | "digital" | "core" | "tagg_plus" | "creator" | "business";

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
  hasMultipleCards: boolean;
  hasBusinessConsole: boolean;
  hasTeamAnalytics: boolean;
  canManageEmployees: boolean;
  canAssignCards: boolean;
  canExportContacts: boolean;
};

const PLAN_ORDER: Record<PlanKey, number> = {
  free: 0,
  digital: 1,
  core: 2,
  tagg_plus: 3,
  creator: 4,
  business: 5
};

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free / Reserved Tagg",
  digital: "Digital",
  core: "Core",
  tagg_plus: "Tagg+",
  creator: "Creator",
  business: "Business"
};

const LEGACY_PLAN_ALIASES: Record<string, PlanKey> = {
  "": "free",
  free: "free",
  reserved: "free",
  "reserved-tagg": "free",
  "reserved_tagg": "free",
  digital: "digital",
  "digital-monthly": "digital",
  "digital_monthly": "digital",
  core: "core",
  essential: "core",
  "essential-monthly": "core",
  "essential-annual": "core",
  tagg_plus: "tagg_plus",
  "tagg-plus": "tagg_plus",
  taggplus: "tagg_plus",
  professional: "tagg_plus",
  creator: "creator",
  premium: "creator",
  founder: "creator",
  business: "business",
  enterprise: "business",
  team: "business"
};

export function normalizePlanKey(value?: string | null): PlanKey {
  const normalized = (value || "").trim().toLowerCase();
  return LEGACY_PLAN_ALIASES[normalized] || "free";
}

export function planAtLeast(plan: PlanKey, minimum: PlanKey) {
  return PLAN_ORDER[plan] >= PLAN_ORDER[minimum];
}

export function getPlanFeatures(plan: PlanKey, isActivated = false): PlanFeatures {
  const isDigital = isActivated && planAtLeast(plan, "digital");
  const isCore = isActivated && planAtLeast(plan, "core");
  const isTaggPlus = planAtLeast(plan, "tagg_plus");
  const isCreator = planAtLeast(plan, "creator");
  const isBusiness = isActivated && plan === "business";
  const hasAnalytics = isActivated && (isTaggPlus || isBusiness);
  const hasAdvancedCustomization = isActivated && (isTaggPlus || isBusiness);
  const hasMultiView = isActivated && isCreator && !isBusiness;

  return {
    key: plan,
    label: PLAN_LABELS[plan],
    isActivated,
    hasDigitalProfile: isDigital,
    hasNfcSharing: isCore || isBusiness,
    hasQrSharing: isDigital || isBusiness,
    hasExpandedLinks: isDigital || isBusiness,
    hasBasicThemes: isCore || isBusiness,
    hasAdvancedCustomization,
    hasBasicAnalytics: hasAnalytics,
    hasContactSharing: isDigital || isBusiness,
    hasContactsDashboard: isDigital || isBusiness,
    hasLeadCapture: isDigital || isBusiness,
    hasCustomButtons: hasAdvancedCustomization,
    hasPrioritySupport: isActivated && (isTaggPlus || isCreator || isBusiness),
    hasAdvancedAnalytics: isActivated && (isCreator || isBusiness),
    hasMoreProfileSections: hasMultiView,
    hasEmbeds: isActivated && isCreator,
    hasBookingLinks: isActivated && isCreator,
    hasSmartRedirects: isActivated && isCreator,
    hasContactExport: isDigital || isBusiness,
    hasMultipleCards: isActivated && (isCreator || isBusiness),
    hasBusinessConsole: isBusiness,
    hasTeamAnalytics: isBusiness,
    canManageEmployees: isBusiness,
    canAssignCards: isBusiness,
    canExportContacts: isDigital || isBusiness
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
  const plan = normalizePlanKey(storedPlan);
  const isActivated = manualActivation || !!profile?.is_active;
  const accessPlan = isActivated ? plan : "free";

  // Plan gating lives here so pricing changes can be made in one place.
  // `is_active` controls paid/manual activation; inactive paid plans fall back
  // to Free so failed or canceled subscriptions cannot keep paid access.
  return getPlanFeatures(accessPlan, isActivated);
}

export function profileCanRenderPublicly(profile?: ProfileRecord | null) {
  return !!profile && canUseDigitalProfile(getProfilePlan(profile));
}

export function canUseDigitalProfile(plan: PlanFeatures) {
  return plan.hasDigitalProfile || plan.hasBusinessConsole;
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

export function canUseBusinessConsole(plan: PlanFeatures) {
  return plan.hasBusinessConsole;
}

export function canUseTeamAnalytics(plan: PlanFeatures) {
  return plan.hasTeamAnalytics;
}

export function canManageEmployees(plan: PlanFeatures) {
  return plan.canManageEmployees;
}

export function canAssignCards(plan: PlanFeatures) {
  return plan.canAssignCards;
}

export function canExportContacts(plan: PlanFeatures) {
  return plan.canExportContacts;
}
