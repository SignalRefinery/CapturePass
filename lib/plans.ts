import type { ProfileRecord } from "@/lib/types";

export type PlanKey = "free" | "core" | "tagg_plus" | "creator";

export type PlanFeatures = {
  key: PlanKey;
  label: string;
  isActivated: boolean;
  hasNfcSharing: boolean;
  hasQrSharing: boolean;
  hasExpandedLinks: boolean;
  hasBasicThemes: boolean;
  hasAdvancedCustomization: boolean;
  hasBasicAnalytics: boolean;
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
};

const PLAN_ORDER: Record<PlanKey, number> = {
  free: 0,
  core: 1,
  tagg_plus: 2,
  creator: 3
};

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free / Reserved Tagg",
  core: "Core",
  tagg_plus: "Tagg+",
  creator: "Creator"
};

const LEGACY_PLAN_ALIASES: Record<string, PlanKey> = {
  "": "free",
  free: "free",
  reserved: "free",
  "reserved-tagg": "free",
  "reserved_tagg": "free",
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
  founder: "creator"
};

export function normalizePlanKey(value?: string | null): PlanKey {
  const normalized = (value || "").trim().toLowerCase();
  return LEGACY_PLAN_ALIASES[normalized] || "free";
}

export function planAtLeast(plan: PlanKey, minimum: PlanKey) {
  return PLAN_ORDER[plan] >= PLAN_ORDER[minimum];
}

export function getPlanFeatures(plan: PlanKey, forceActivated = false): PlanFeatures {
  const isActivated = forceActivated || planAtLeast(plan, "core");
  const isTaggPlus = planAtLeast(plan, "tagg_plus");
  const isCreator = planAtLeast(plan, "creator");

  return {
    key: plan,
    label: PLAN_LABELS[plan],
    isActivated,
    hasNfcSharing: isActivated,
    hasQrSharing: isActivated,
    hasExpandedLinks: isActivated,
    hasBasicThemes: isActivated,
    hasAdvancedCustomization: isTaggPlus,
    hasBasicAnalytics: isTaggPlus,
    hasLeadCapture: isTaggPlus,
    hasCustomButtons: isTaggPlus,
    hasPrioritySupport: isTaggPlus,
    hasAdvancedAnalytics: isCreator,
    hasMoreProfileSections: isCreator,
    hasEmbeds: isCreator,
    hasBookingLinks: isCreator,
    hasSmartRedirects: isCreator,
    hasContactExport: isCreator,
    hasMultipleCards: isCreator
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

  // Plan gating lives here so pricing changes can be made in one place.
  // `is_active` controls paid/manual activation; the plan key controls feature depth.
  return getPlanFeatures(plan, manualActivation || !!profile?.is_active);
}

export function profileCanRenderPublicly(profile?: ProfileRecord | null) {
  return !!profile && getProfilePlan(profile).isActivated;
}
