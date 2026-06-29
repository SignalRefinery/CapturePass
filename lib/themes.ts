import { designTokens } from "@/lib/design-tokens";
import type { PlanKey, PlanFeatures } from "@/lib/plans";

export type ThemeKey =
  | "capturepass_brand"
  | "tt_classic"
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
};

export const DEFAULT_THEME_KEY: ThemeKey = "capturepass_brand";
export const CUSTOM_THEME_KEY: ThemeKey = "custom";

export const THEME_PRESETS: Record<ThemeKey, ThemeDefinition> = {
  capturepass_brand: {
    key: "capturepass_brand",
    name: "CapturePass Brand",
    description: "The core CapturePass blue, gold, and charcoal palette for personal profiles.",
    colors: {
      primary: designTokens.colors.primary,
      secondary: designTokens.colors.deepBlue,
      accent: designTokens.colors.insightGold,
      text: designTokens.colors.charcoal,
      background: designTokens.colors.background
    },
  },
  tt_classic: {
    key: "tt_classic",
    name: "TT Classic",
    description: "The original purple palette, preserved as a legacy profile theme.",
    colors: {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      accent: "#C084FC",
      text: "#FFFFFF",
      background: "#030304"
    },
  },
  executive_navy: {
    key: "executive_navy",
    name: "Classic Navy",
    description: "A legacy navy palette kept for existing business branding.",
    colors: {
      primary: "#1D4ED8",
      secondary: "#0F172A",
      accent: "#60A5FA",
      text: "#F8FAFC",
      background: "#0B1220"
    },
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
  },
  executive_gold: {
    key: "executive_gold",
    name: "Amber Night",
    description: "A dark profile palette with warm amber accents.",
    colors: {
      primary: "#D4A017",
      secondary: "#1E293B",
      accent: "#F5C451",
      text: "#FFF8E7",
      background: "#111827"
    },
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
  },
  sage_professional: {
    key: "sage_professional",
    name: "Sage Studio",
    description: "A fresh profile palette with confident green accents.",
    colors: {
      primary: "#059669",
      secondary: "#0F3D2E",
      accent: "#34D399",
      text: "#F8FAF7",
      background: "#08261B"
    },
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
  },
  ivory_executive: {
    key: "ivory_executive",
    name: "Warm Ivory",
    description: "A warm light profile with understated amber accents.",
    colors: {
      primary: "#B45309",
      secondary: "#F7F3ED",
      accent: "#D97706",
      text: "#2C241D",
      background: "#FFFDF9"
    },
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
  },
  emerald_executive: {
    key: "emerald_executive",
    name: "Emerald Studio",
    description: "A fresh light profile with confident green accents.",
    colors: {
      primary: "#059669",
      secondary: "#ECFDF5",
      accent: "#10B981",
      text: "#1F2937",
      background: "#F7FFFB"
    },
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
  },
  custom: {
    key: "custom",
    name: "Custom Brand Colors",
    description: "Use your own CTA, icon, glow, background, and text colors.",
    colors: {
      primary: designTokens.colors.primary,
      secondary: designTokens.colors.deepBlue,
      accent: designTokens.colors.insightGold,
      background: designTokens.colors.background,
      text: designTokens.colors.charcoal
    },
  }
};

const CANONICAL_THEME_KEYS: ThemeKey[] = [
  "capturepass_brand",
  "tt_classic",
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

// Stored rows may still reference older theme keys. Keep aliases isolated here
// so current UI labels can move forward without breaking existing profiles.
const THEME_ALIASES: Record<string, ThemeKey> = {
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
  if (!value) {
    return DEFAULT_THEME_KEY;
  }

  const aliased = THEME_ALIASES[value];
  if (aliased) {
    return aliased;
  }

  if (value in THEME_PRESETS) {
    return value as ThemeKey;
  }

  return DEFAULT_THEME_KEY;
}

export function themeIsAllowedForPlan(themeKey: ThemeKey, _plan: PlanKey) {
  return true;
}

export function allowedThemesForPlan(_plan: PlanFeatures | PlanKey) {
  return THEME_OPTIONS;
}

export function coerceThemeForPlan(themeKey: string | null | undefined, _plan: PlanFeatures | PlanKey) {
  const normalized = normalizeThemeKey(themeKey);
  if (normalized === "executive_navy") {
    return DEFAULT_THEME_KEY;
  }

  return normalized;
}

const LIGHT_THEME_KEYS = new Set<ThemeKey>([
  "capturepass_brand",
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
