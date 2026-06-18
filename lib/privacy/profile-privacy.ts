import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const PROFILE_NOINDEX_VALUE =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate";

export const PROFILE_CACHE_HEADERS = {
  "X-Robots-Tag": PROFILE_NOINDEX_VALUE,
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0"
} as const;

export type ProfileVisibility = "public" | "unlisted" | "private";

const PROFILE_PUBLIC_VALUE = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    noimageindex: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1
  }
} as const;

const PROFILE_PRIVATE_VALUE = {
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
} as const;

export const SITE_ROUTES = new Set([
  "",
  "admin",
  "api",
  "dashboard",
  "contact",
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
  "business",
  "business-individual",
  "contact-capture-nfc-cards",
  "dealerships",
  "forgot-password",
  "insurance-agents",
  "real-estate-agents",
  "resources",
  "springfield-il-contact-capture",
  "springfield-il-digital-business-cards",
  "springfield-il-nfc-business-cards",
  "springfield-il-sales-team-business-cards",
  "sales-teams",
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

function buildRobots(visibility: ProfileVisibility): Metadata["robots"] {
  return visibility === "public" ? PROFILE_PUBLIC_VALUE : PROFILE_PRIVATE_VALUE;
}

export function profileMetadata(input?: {
  description?: string;
  path?: string;
  title?: string;
  visibility?: ProfileVisibility;
}): Metadata {
  if (!input) {
    return {
      robots: PROFILE_PRIVATE_VALUE,
      referrer: "no-referrer",
      openGraph: {
        title: "CapturePass Profile",
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

  const visibility = input.visibility || "private";
  const baseMetadata = buildPageMetadata({
    title: input.title || "CapturePass Profile",
    description: input.description || "",
    path: input.path || "/"
  });

  const metadata: Metadata = {
    ...baseMetadata,
    robots: buildRobots(visibility),
    referrer: "no-referrer"
  };

  if (visibility !== "public") {
    metadata.other = {
      robots: PROFILE_NOINDEX_VALUE,
      googlebot: PROFILE_NOINDEX_VALUE,
      bingbot: PROFILE_NOINDEX_VALUE
    };
  }

  return metadata;
}
