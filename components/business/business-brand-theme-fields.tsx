"use client";

import { useState } from "react";
import { BUSINESS_THEME_OPTIONS, CUSTOM_THEME_KEY, normalizeThemeKey } from "@/lib/themes";
import type { OrganizationRecord } from "@/lib/types";

type BusinessBrandThemeFieldsProps = {
  organization: Pick<
    OrganizationRecord,
    "theme_key" | "brand_theme" | "brand_color" | "brand_color_primary" | "brand_color_secondary" | "brand_color_accent"
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

  return (
    <div className="brand-theme-section">
      <div className="dashboard-kicker">Brand Theme</div>
      <div className="theme-choice-list" role="radiogroup" aria-label="Business brand theme">
        {BUSINESS_THEME_OPTIONS.map((theme) => (
          <label className="theme-choice-card" key={theme.key}>
            <input
              type="radio"
              name="theme_key"
              value={theme.key}
              checked={themeKey === theme.key}
              onChange={() => setThemeKey(theme.key)}
            />
            <span>
              <strong>{theme.name}</strong>
              <small>{theme.description}</small>
            </span>
          </label>
        ))}
      </div>

      {showCustomColors ? (
        <div className="editor-grid theme-custom-grid">
          <label className="editor-label">
            Primary color
            <input
              className="editor-input"
              name="brand_color_primary"
              type="color"
              defaultValue={organization.brand_color_primary || organization.brand_color || "#0F172A"}
            />
          </label>
          <label className="editor-label">
            Secondary color
            <input
              className="editor-input"
              name="brand_color_secondary"
              type="color"
              defaultValue={organization.brand_color_secondary || "#1E293B"}
            />
          </label>
          <label className="editor-label">
            Accent color
            <input
              className="editor-input"
              name="brand_color_accent"
              type="color"
              defaultValue={organization.brand_color_accent || "#2563EB"}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
