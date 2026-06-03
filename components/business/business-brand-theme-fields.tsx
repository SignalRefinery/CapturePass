"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { BUSINESS_THEME_OPTIONS, CUSTOM_THEME_KEY, THEME_COLOR_ROLE_LABELS, normalizeThemeKey, resolveThemeColors } from "@/lib/themes";
import type { OrganizationRecord } from "@/lib/types";

type BusinessBrandThemeFieldsProps = {
  organization: Pick<
    OrganizationRecord,
    | "theme_key"
    | "brand_theme"
    | "brand_color"
    | "brand_color_primary"
    | "brand_color_secondary"
    | "brand_color_accent"
    | "brand_color_background"
    | "brand_color_text"
  >;
};

function themeKeyForOrganization(organization: BusinessBrandThemeFieldsProps["organization"]) {
  if (organization.theme_key) {
    return normalizeThemeKey(organization.theme_key);
  }

  switch (organization.brand_theme) {
    case "custom":
      return CUSTOM_THEME_KEY;
    case "clean_light":
      return "clean_horizon";
    case "deep_brand":
    case "full_color":
    default:
      return "executive_navy";
  }
}

export function BusinessBrandThemeFields({ organization }: BusinessBrandThemeFieldsProps) {
  const initialThemeKey = themeKeyForOrganization(organization);
  const [themeKey, setThemeKey] = useState(initialThemeKey);
  const showCustomColors = themeKey === CUSTOM_THEME_KEY;
  const customThemeColors = resolveThemeColors({
    themeKey: CUSTOM_THEME_KEY,
    customPrimary: organization.brand_color_primary || organization.brand_color,
    customSecondary: organization.brand_color_secondary,
    customAccent: organization.brand_color_accent,
    customBackground: organization.brand_color_background,
    customText: organization.brand_color_text
  });

  return (
    <div className="brand-theme-section">
      <div className="dashboard-kicker">Brand Theme</div>
      <input type="hidden" name="theme_key" value={themeKey} />
      <div className="theme-choice-list" role="radiogroup" aria-label="Business brand theme">
        {BUSINESS_THEME_OPTIONS.map((theme) => {
          const colors = theme.key === CUSTOM_THEME_KEY ? customThemeColors : theme.colors;

          return (
            <label className="theme-choice-card" key={theme.key}>
              <input
                type="radio"
                name="theme_key_choice"
                value={theme.key}
                checked={themeKey === theme.key}
                onChange={() => setThemeKey(theme.key)}
              />
              <span>
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
                <span
                  className="theme-preview-strip"
                  style={{
                    "--theme-preview-primary": colors.primary,
                    "--theme-preview-secondary": colors.secondary,
                    "--theme-preview-accent": colors.accent,
                    "--theme-preview-background": colors.background,
                    "--theme-preview-text": colors.text || "#FFFFFF"
                  } as CSSProperties}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {showCustomColors ? (
        <div className="editor-grid theme-custom-grid">
          <label className="editor-label">
            {THEME_COLOR_ROLE_LABELS.primary}
            <input
              className="editor-input"
              name="brand_color_primary"
              type="color"
              defaultValue={organization.brand_color_primary || organization.brand_color || "#0F172A"}
            />
          </label>
          <label className="editor-label">
            {THEME_COLOR_ROLE_LABELS.secondary}
            <input
              className="editor-input"
              name="brand_color_secondary"
              type="color"
              defaultValue={organization.brand_color_secondary || "#1E293B"}
            />
          </label>
          <label className="editor-label">
            {THEME_COLOR_ROLE_LABELS.accent}
            <input
              className="editor-input"
              name="brand_color_accent"
              type="color"
              defaultValue={organization.brand_color_accent || "#2563EB"}
            />
          </label>
          <label className="editor-label">
            {THEME_COLOR_ROLE_LABELS.background}
            <input
              className="editor-input"
              name="brand_color_background"
              type="color"
              defaultValue={organization.brand_color_background || customThemeColors.background}
            />
          </label>
          <label className="editor-label">
            {THEME_COLOR_ROLE_LABELS.text}
            <input
              className="editor-input"
              name="brand_color_text"
              type="color"
              defaultValue={organization.brand_color_text || "#FFFFFF"}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
