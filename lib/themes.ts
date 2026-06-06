import type { PlanKey, PlanFeatures } from "@/lib/plans";

export type ThemeKey =
  | "taptagg_brand"
  | "executive_navy"
  | "modern_slate"
  | "executive_gold"
  | "clean_horizon"
  | "sage_professional"
  | "arctic_white"
  | "ivory_executive"
  | "coastal_blue"
  | "emerald_executive"
  | "sandstone"
  | "modern_rose"
  | "custom";

export type ThemeColors = {
  /** CTA color used for primary buttons like Add to Contacts. */
  primary: string;
  /** Icon/avatar badge color. */
  secondary: string;
  /** Glow, highlights, borders, and decorative detail color. */
  accent: string;
  /** Background color for the page or profile shell. */
  background: string;
  /** Readable text color. */
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
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      accent: "#C084FC",
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
      primary: "#1D4ED8",
      secondary: "#0F172A",
      accent: "#60A5FA",
      text: "#F8FAFC",
      background: "#0B1220"
    },
    allowedPlans: ["free", "digital", "core", "tagg_plus", "creator", "business"]
  },
  modern_slate: {
    key: "modern_slate",
    name: "Modern Slate",
    description: "A crisp slate theme with a bright cyan accent.",
    colors: {
      primary: "#06B6D4",
      secondary: "#111827",
      accent: "#38BDF8",
      text: "#F8FAFC",
      background: "#111827"
    },
    allowedPlans: ["core", "tagg_plus", "creator", "business"]
  },
  executive_gold: {
    key: "executive_gold",
    name: "Executive Gold",
    description: "A premium dark executive palette with warm gold accents.",
    colors: {
      primary: "#D4A017",
      secondary: "#1E293B",
      accent: "#F5C451",
      text: "#FFF8E7",
      background: "#111827"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  clean_horizon: {
    key: "clean_horizon",
    name: "Arctic White",
    description: "A crisp white profile with clean blue action emphasis.",
    colors: {
      primary: "#2563EB",
      secondary: "#E2E8F0",
      accent: "#60A5FA",
      text: "#111827",
      background: "#F8FBFF"
    },
    allowedPlans: ["core", "tagg_plus", "creator", "business"]
  },
  sage_professional: {
    key: "sage_professional",
    name: "Emerald Executive",
    description: "A fresh light profile with confident green professional accents.",
    colors: {
      primary: "#059669",
      secondary: "#0F3D2E",
      accent: "#34D399",
      text: "#F8FAF7",
      background: "#08261B"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  arctic_white: {
    key: "arctic_white",
    name: "Arctic White",
    description: "A crisp white profile with clean blue action emphasis.",
    colors: {
      primary: "#2563EB",
      secondary: "#E5E7EB",
      accent: "#60A5FA",
      text: "#111827",
      background: "#FFFFFF"
    },
    allowedPlans: ["core", "tagg_plus", "creator", "business"]
  },
  ivory_executive: {
    key: "ivory_executive",
    name: "Ivory Executive",
    description: "A warm premium light profile with understated executive accents.",
    colors: {
      primary: "#B45309",
      secondary: "#F7F3ED",
      accent: "#D97706",
      text: "#2C241D",
      background: "#FFFDF9"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  coastal_blue: {
    key: "coastal_blue",
    name: "Coastal Blue",
    description: "A bright approachable profile with polished blue accents.",
    colors: {
      primary: "#0284C7",
      secondary: "#EAF4FF",
      accent: "#38BDF8",
      text: "#0F172A",
      background: "#F8FBFF"
    },
    allowedPlans: ["core", "tagg_plus", "creator", "business"]
  },
  emerald_executive: {
    key: "emerald_executive",
    name: "Emerald Executive",
    description: "A fresh light profile with confident green professional accents.",
    colors: {
      primary: "#059669",
      secondary: "#ECFDF5",
      accent: "#10B981",
      text: "#1F2937",
      background: "#F7FFFB"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  sandstone: {
    key: "sandstone",
    name: "Sandstone",
    description: "A warm refined profile for real estate, lending, and boutique brands.",
    colors: {
      primary: "#C08457",
      secondary: "#F5F1E8",
      accent: "#D97706",
      text: "#3A312A",
      background: "#FDFBF8"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  modern_rose: {
    key: "modern_rose",
    name: "Modern Rose",
    description: "A clean expressive light profile with boutique rose accents.",
    colors: {
      primary: "#E11D48",
      secondary: "#FFF1F2",
      accent: "#FB7185",
      text: "#1F2937",
      background: "#FFFDFD"
    },
    allowedPlans: ["tagg_plus", "creator", "business"]
  },
  custom: {
    key: "custom",
    name: "Custom Brand Colors",
    description: "Use your own CTA, icon, glow, background, and text colors.",
    colors: {
      primary: "#0F172A",
      secondary: "#1E293B",
      accent: "#2563EB",
      background: "#F8FAFC",
      text: "#111827"
    },
    allowedPlans: ["creator", "business"]
  }
};

const CANONICAL_THEME_KEYS: ThemeKey[] = [
  "taptagg_brand",
  "executive_navy",
  "modern_slate",
  "executive_gold",
  "clean_horizon",
  "sage_professional",
  "ivory_executive",
  "coastal_blue",
  "sandstone",
  "modern_rose",
  "custom"
];

const THEME_ALIASES: Partial<Record<ThemeKey, ThemeKey>> = {
  arctic_white: "clean_horizon",
  emerald_executive: "sage_professional"
};

export const THEME_OPTIONS = CANONICAL_THEME_KEYS.map((key) => THEME_PRESETS[key]);
export const PRESET_THEME_OPTIONS = THEME_OPTIONS.filter((theme) => theme.key !== CUSTOM_THEME_KEY);
export const BUSINESS_THEME_OPTIONS = THEME_OPTIONS;
export const PROFILE_THEME_OPTIONS = THEME_OPTIONS.filter((theme) => theme.key !== "executive_navy");

export const THEME_COLOR_ROLE_LABELS = {
  primary: "CTA Color",
  secondary: "Icon Color",
  accent: "Accent / Glow Color",
  background: "Background Color",
  text: "Text Color"
} as const;

export function normalizeThemeKey(value?: string | null): ThemeKey {
  if (!value || !(value in THEME_PRESETS)) {
    return DEFAULT_THEME_KEY;
  }

  const themeKey = value as ThemeKey;
  return THEME_ALIASES[themeKey] || themeKey;
}

export function themeIsAllowedForPlan(themeKey: ThemeKey, plan: PlanKey) {
  if (themeKey === DEFAULT_THEME_KEY) {
    return true;
  }

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

const LIGHT_THEME_KEYS = new Set<ThemeKey>([
  "clean_horizon",
  "arctic_white",
  "ivory_executive",
  "coastal_blue",
  "emerald_executive",
  "sandstone",
  "modern_rose"
]);

function hexToRgb(value: string) {
  if (!isHexColor(value)) {
    return null;
  }

  const hex = value.slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16)
  };
}

function relativeLuminance(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) {
    return null;
  }

  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * transform(rgb.r) + 0.7152 * transform(rgb.g) + 0.0722 * transform(rgb.b);
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);

  if (foregroundLuminance === null || backgroundLuminance === null) {
    return 0;
  }

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function bestReadableTextColor(background: string, preferredText?: string | null) {
  const darkText = "#111827";
  const lightText = "#FFFFFF";
  const preferred = isHexColor(preferredText) ? preferredText : null;

  if (preferred && contrastRatio(preferred, background) >= 4.5) {
    return preferred;
  }

  return contrastRatio(lightText, background) >= contrastRatio(darkText, background) ? lightText : darkText;
}

function normalizeThemeColors(colors: ThemeColors): ThemeColors {
  const background = isHexColor(colors.background) ? colors.background : "#FFFFFF";

  return {
    ...colors,
    background,
    text: bestReadableTextColor(background, colors.text)
  };
}

export function themeUsesLightShell(themeKey?: string | null, background?: string | null) {
  const normalized = normalizeThemeKey(themeKey);

  if (normalized === CUSTOM_THEME_KEY) {
    return isHexColor(background) ? (relativeLuminance(background) ?? 0) > 0.5 : false;
  }

  return LIGHT_THEME_KEYS.has(normalized);
}

export function resolveThemeColors({
  themeKey,
  customPrimary,
  customSecondary,
  customAccent,
  customBackground,
  customText
}: {
  themeKey?: string | null;
  customPrimary?: string | null;
  customSecondary?: string | null;
  customAccent?: string | null;
  customBackground?: string | null;
  customText?: string | null;
}): ThemeColors {
  const normalized = normalizeThemeKey(themeKey);
  const preset = THEME_PRESETS[normalized];

  if (normalized !== CUSTOM_THEME_KEY) {
    return normalizeThemeColors(preset.colors);
  }

  return normalizeThemeColors({
    ...preset.colors,
    primary: isHexColor(customPrimary) ? customPrimary : preset.colors.primary,
    secondary: isHexColor(customSecondary) ? customSecondary : preset.colors.secondary,
    accent: isHexColor(customAccent) ? customAccent : preset.colors.accent,
    background: isHexColor(customBackground) ? customBackground : preset.colors.background,
    text: isHexColor(customText) ? customText : preset.colors.text
  });
}

export function isHexColor(value?: string | null): value is string {
  return /^#[0-9a-fA-F]{6}$/.test((value || "").trim());
}
