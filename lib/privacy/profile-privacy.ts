import type { Metadata } from "next";

export const PROFILE_NOINDEX_VALUE =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate";

export const PROFILE_CACHE_HEADERS = {
  "X-Robots-Tag": PROFILE_NOINDEX_VALUE,
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0"
} as const;

export const SITE_ROUTES = new Set([
  "",
  "admin",
  "api",
  "dashboard",
  "how-it-works",
  "legal",
  "live-demo",
  "login",
  "partners",
  "partner-request",
  "pricing",
  "privacy",
  "signup",
  "terms",
  "account",
  "auth",
  "custom",
  "forgot-password",
  "update-password"
]);

export function isTokenProfilePath(pathname: string) {
  return /^\/u\/[^/]+\/?$/.test(pathname);
}

export function isPublicPassPath(pathname: string) {
  return /^\/pass\/[^/]+\/?$/.test(pathname);
}

export function isLikelyProfilePath(pathname: string) {
  const clean = pathname.split("?")[0].replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return false;
  if (clean.includes("/")) return false;
  return !SITE_ROUTES.has(clean);
}

export function profileMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": 0
      }
    },
    referrer: "no-referrer",
    openGraph: {
      title: "SignalPass Profile",
      description: "",
      type: "website"
    },
    other: {
      robots: PROFILE_NOINDEX_VALUE,
      googlebot: PROFILE_NOINDEX_VALUE,
      bingbot: PROFILE_NOINDEX_VALUE
    }
  };
}
