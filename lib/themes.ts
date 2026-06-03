import type { PlanKey, PlanFeatures } from "@/lib/plans";

export type ThemeKey =
  | "taptagg_brand"
  | "executive_navy"
  | "modern_slate"
  | "executive_gold"
  | "clean_horizon"
  | "sage_professional"
  | "custom";

export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text?: string;
};

export type ThemeDefinition = {
  key: ThemeKey;
  name: string;
  description: string;
  colors: ThemeColors;
  allowedPlans: PlanKey[];
};

export const DEFAULT_THEME_KEY: ThemeKey = "taptagg_brand";
export const CUSTOM_THEME_KEY: ThemeKey = "custom";

export const THEME_PRESETS: Record<ThemeKey, ThemeDefinition> = {
  taptagg_brand: {
    key: "taptagg_brand",
    name: "TapTagg Brand",
    description: "The TapTagg purple palette for personal profiles.",
    colors: {
      primary: "#08080A",
      secondary: "#8B5CF6",
      accent: "#8B5CF6",
      text: "#FFFFFF",
      background: "#030304"
    },
    allowedPlans: ["free", "digital", "core", "tagg_plus", "creator", "business"]
  },
  executive_navy: {
    key: "executive_navy",
    name: "Executive Navy",
    description: "A confident navy palette for polished professional profiles.",
    colors: {
      primary: "#0F172A",
      secondary: "#1E293B",
      accent: "#2563EB",
      text: "#FFFFFF",
      background: "#F8FAFC"
    },
    allowedPlans: ["free", "digital", "core", "tagg_plus", "creator", "business"]
  },
  modern_slate: {
    key: "modern_slate",
    name: "Modern Slate",
    description: "A crisp slate theme with a bright cyan accent.",
    colors: {
      primary: "#111827",
      secondary: "#374151",
      accent: "#06B6D4",
      text: "#FFFFFF",
      background: "#F9FAFB"
    },
    allowedPlans: ["core", "tagg_plus", "creator", "business"]
  },
  executive_gold: {
    key: "executive_gold",
    name: "Executive Gold",
    description: "A premium dark executive palette with warm gold accents.",
    colors: {
      primary: "#1C2431",
      secondary: "#334155",
      accent: "#D4A017",
      text: "#FFFAF0",
      background: "#FAF8F3"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  clean_horizon: {
    key: "clean_horizon",
    name: "Clean Horizon",
    description: "A clean light profile with blue action emphasis.",
    colors: {
      primary: "#FFFFFF",
      secondary: "#E5E7EB",
      accent: "#2563EB",
      text: "#1F2937",
      background: "#F8FAFC"
    },
    allowedPlans: ["core", "tagg_plus", "creator", "business"]
  },
  sage_professional: {
    key: "sage_professional",
    name: "Sage Professional",
    description: "A calm light profile with organic professional color.",
    colors: {
      primary: "#F7F7F2",
      secondary: "#DDE5D8",
      accent: "#5C7C5A",
      text: "#2D3748",
      background: "#FFFFFF"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  custom: {
    key: "custom",
    name: "Custom Brand Colors",
    description: "Use your own primary, secondary, and accent colors.",
    colors: {
      primary: "#0F172A",
      secondary: "#1E293B",
      accent: "#2563EB",
      background: "#F8FAFC"
    },
    allowedPlans: ["creator", "business"]
  }
};

export const THEME_OPTIONS = Object.values(THEME_PRESETS);
export const PRESET_THEME_OPTIONS = THEME_OPTIONS.filter((theme) => theme.key !== CUSTOM_THEME_KEY);
export const BUSINESS_THEME_OPTIONS = THEME_OPTIONS.filter((theme) => theme.key !== "taptagg_brand");
export const PROFILE_THEME_OPTIONS = THEME_OPTIONS.filter((theme) => theme.key !== "executive_navy");

export function normalizeThemeKey(value?: string | null): ThemeKey {
  return value && value in THEME_PRESETS ? (value as ThemeKey) : DEFAULT_THEME_KEY;
}

export function themeIsAllowedForPlan(themeKey: ThemeKey, plan: PlanKey) {
  return THEME_PRESETS[themeKey].allowedPlans.includes(plan);
}

export function allowedThemesForPlan(plan: PlanFeatures | PlanKey) {
  const key = typeof plan === "string" ? plan : plan.key;
  return THEME_OPTIONS.filter((theme) => themeIsAllowedForPlan(theme.key, key));
}

export function coerceThemeForPlan(themeKey: string | null | undefined, plan: PlanFeatures | PlanKey) {
  const normalized = normalizeThemeKey(themeKey);
  const key = typeof plan === "string" ? plan : plan.key;
  if (normalized === "executive_navy" && key !== "business") {
    return DEFAULT_THEME_KEY;
  }

  return themeIsAllowedForPlan(normalized, key) ? normalized : DEFAULT_THEME_KEY;
}

export function resolveThemeColors({
  themeKey,
  customPrimary,
  customSecondary,
  customAccent,
  customText
}: {
  themeKey?: string | null;
  customPrimary?: string | null;
  customSecondary?: string | null;
  customAccent?: string | null;
  customText?: string | null;
}): ThemeColors {
  const normalized = normalizeThemeKey(themeKey);
  const preset = THEME_PRESETS[normalized];

  if (normalized !== CUSTOM_THEME_KEY) {
    return preset.colors;
  }

  return {
    ...preset.colors,
    primary: isHexColor(customPrimary) ? customPrimary : preset.colors.primary,
    secondary: isHexColor(customSecondary) ? customSecondary : preset.colors.secondary,
    accent: isHexColor(customAccent) ? customAccent : preset.colors.accent,
    text: isHexColor(customText) ? customText : preset.colors.text
  };
}

export function isHexColor(value?: string | null): value is string {
  return /^#[0-9a-fA-F]{6}$/.test((value || "").trim());
}
