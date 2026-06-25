export type SecondaryActionMode = "call" | "text" | "email" | "none";

const SECONDARY_ACTION_MODES = new Set<SecondaryActionMode>(["call", "text", "email", "none"]);

export type SecondaryActionSource = {
  secondary_action_mode?: string | null;
  show_text?: boolean | null;
  phone?: string | null;
  text_phone?: string | null;
};

export function normalizeSecondaryActionMode(value?: string | null): SecondaryActionMode {
  const normalized = (value || "").trim().toLowerCase();
  return SECONDARY_ACTION_MODES.has(normalized as SecondaryActionMode)
    ? (normalized as SecondaryActionMode)
    : "text";
}

export function secondaryActionModeFromLegacyShowText(showText?: boolean | null): SecondaryActionMode {
  if (showText === true) {
    return "text";
  }

  if (showText === false) {
    return "email";
  }

  return "none";
}

export function secondaryActionModeToLegacyShowText(mode?: string | null) {
  switch (normalizeSecondaryActionMode(mode)) {
    case "call":
    case "text":
      return true;
    case "email":
      return false;
    case "none":
    default:
      return null;
  }
}

export function resolveSecondaryActionMode(source?: SecondaryActionSource | null) {
  if (source?.secondary_action_mode) {
    return normalizeSecondaryActionMode(source.secondary_action_mode);
  }

  if (typeof source?.show_text !== "undefined") {
    return secondaryActionModeFromLegacyShowText(source.show_text);
  }

  if (source?.text_phone || source?.phone) {
    return "text";
  }

  return "none";
}
