export type BusinessPlanTier = "small_team" | "starter" | "growth" | "pro";
export type BusinessBillingInterval = "monthly" | "annual";

export type BusinessPlanKey =
  | "business_small_team_self"
  | "business_small_team_managed"
  | "business_starter_self"
  | "business_starter_managed"
  | "business_growth_self"
  | "business_growth_managed"
  | "business_pro_self"
  | "business_pro_managed";

export type BusinessPlanConfig = {
  key: BusinessPlanKey;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  setupFee: number;
  seatLimit: number;
  includedCards: number;
  managed: boolean;
  tier: BusinessPlanTier;
  monthlyPriceEnv: string;
  annualPriceEnv: string;
  setupPriceEnv: string;
};

export const BUSINESS_PLANS: Record<BusinessPlanKey, BusinessPlanConfig> = {
  business_small_team_self: {
    key: "business_small_team_self",
    name: "Small Team",
    monthlyPrice: 99,
    annualPrice: 1069,
    setupFee: 99,
    seatLimit: 5,
    includedCards: 5,
    managed: false,
    tier: "small_team",
    monthlyPriceEnv: "STRIPE_BUSINESS_SMALL_TEAM_SELF_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_SMALL_TEAM_SELF_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_SMALL_TEAM_SETUP_PRICE_ID"
  },
  business_small_team_managed: {
    key: "business_small_team_managed",
    name: "Small Team",
    monthlyPrice: 149,
    annualPrice: 1609,
    setupFee: 99,
    seatLimit: 5,
    includedCards: 5,
    managed: true,
    tier: "small_team",
    monthlyPriceEnv: "STRIPE_BUSINESS_SMALL_TEAM_MANAGED_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_SMALL_TEAM_MANAGED_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_SMALL_TEAM_SETUP_PRICE_ID"
  },
  business_starter_self: {
    key: "business_starter_self",
    name: "Business Starter",
    monthlyPrice: 199,
    annualPrice: 2149,
    setupFee: 149,
    seatLimit: 10,
    includedCards: 10,
    managed: false,
    tier: "starter",
    monthlyPriceEnv: "STRIPE_BUSINESS_STARTER_SELF_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_STARTER_SELF_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_STARTER_SETUP_PRICE_ID"
  },
  business_starter_managed: {
    key: "business_starter_managed",
    name: "Business Starter Managed",
    monthlyPrice: 299,
    annualPrice: 3229,
    setupFee: 149,
    seatLimit: 10,
    includedCards: 10,
    managed: true,
    tier: "starter",
    monthlyPriceEnv: "STRIPE_BUSINESS_STARTER_MANAGED_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_STARTER_MANAGED_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_STARTER_SETUP_PRICE_ID"
  },
  business_growth_self: {
    key: "business_growth_self",
    name: "Business Growth",
    monthlyPrice: 399,
    annualPrice: 4309,
    setupFee: 299,
    seatLimit: 25,
    includedCards: 25,
    managed: false,
    tier: "growth",
    monthlyPriceEnv: "STRIPE_BUSINESS_GROWTH_SELF_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_GROWTH_SELF_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_GROWTH_SETUP_PRICE_ID"
  },
  business_growth_managed: {
    key: "business_growth_managed",
    name: "Business Growth Managed",
    monthlyPrice: 599,
    annualPrice: 6469,
    setupFee: 299,
    seatLimit: 25,
    includedCards: 25,
    managed: true,
    tier: "growth",
    monthlyPriceEnv: "STRIPE_BUSINESS_GROWTH_MANAGED_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_GROWTH_MANAGED_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_GROWTH_SETUP_PRICE_ID"
  },
  business_pro_self: {
    key: "business_pro_self",
    name: "Business Pro",
    monthlyPrice: 699,
    annualPrice: 7549,
    setupFee: 499,
    seatLimit: 50,
    includedCards: 50,
    managed: false,
    tier: "pro",
    monthlyPriceEnv: "STRIPE_BUSINESS_PRO_SELF_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_PRO_SELF_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_PRO_SETUP_PRICE_ID"
  },
  business_pro_managed: {
    key: "business_pro_managed",
    name: "Business Pro Managed",
    monthlyPrice: 999,
    annualPrice: 10789,
    setupFee: 499,
    seatLimit: 50,
    includedCards: 50,
    managed: true,
    tier: "pro",
    monthlyPriceEnv: "STRIPE_BUSINESS_PRO_MANAGED_PRICE_ID",
    annualPriceEnv: "STRIPE_BUSINESS_PRO_MANAGED_ANNUAL_PRICE_ID",
    setupPriceEnv: "STRIPE_BUSINESS_PRO_SETUP_PRICE_ID"
  }
};

export const BUSINESS_PLAN_KEYS = Object.keys(BUSINESS_PLANS) as BusinessPlanKey[];

export const BUSINESS_PLAN_INCLUDED_LOCATION_COUNTS: Record<BusinessPlanTier, number> = {
  small_team: 1,
  starter: 1,
  growth: 3,
  pro: 10
};

export function isBusinessPlanKey(value?: string | null): value is BusinessPlanKey {
  return !!value && value in BUSINESS_PLANS;
}

export function getBusinessPlan(value?: string | null) {
  return isBusinessPlanKey(value) ? BUSINESS_PLANS[value] : null;
}

export function getBusinessIncludedLocationCount(value?: string | null) {
  const plan = getBusinessPlan(value);
  return plan ? BUSINESS_PLAN_INCLUDED_LOCATION_COUNTS[plan.tier] : 1;
}

export function businessPlanIncludesAdditionalLocations(value?: string | null) {
  return getBusinessIncludedLocationCount(value) > 1;
}

export function normalizeBusinessBillingInterval(value?: string | null): BusinessBillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

export function getBusinessRecurringPriceId(
  plan: BusinessPlanConfig,
  billingInterval: BusinessBillingInterval = "monthly"
) {
  return process.env[billingInterval === "annual" ? plan.annualPriceEnv : plan.monthlyPriceEnv] || null;
}

export function getBusinessSetupPriceId(plan: BusinessPlanConfig) {
  return process.env[plan.setupPriceEnv] || null;
}

export function businessPlanFromRecurringPriceId(priceId?: string | null) {
  if (!priceId) return null;

  for (const key of BUSINESS_PLAN_KEYS) {
    const plan = BUSINESS_PLANS[key];
    if (getBusinessRecurringPriceId(plan, "monthly") === priceId) {
      return { plan, billingInterval: "monthly" as const };
    }
    if (getBusinessRecurringPriceId(plan, "annual") === priceId) {
      return { plan, billingInterval: "annual" as const };
    }
  }

  return null;
}
