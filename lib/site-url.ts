export function normalizeSiteOrigin(value?: string | null) {
  const raw = (value || "https://capturepass.com").trim().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `https://${raw.replace(/^\/+/, "")}`;
}

export function getSiteOrigin() {
  return normalizeSiteOrigin(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL);
}

