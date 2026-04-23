import { slugify } from "@/lib/utils";

export type SlugModerationResult = {
  normalized: string;
  state: "allowed" | "review" | "blocked";
  reason: string | null;
};

const BLOCKED_EXACT = new Set([
  "about",
  "abuse",
  "account",
  "accounts",
  "admin",
  "admin-support",
  "affiliate",
  "affiliates",
  "api",
  "billing",
  "careers",
  "cdn",
  "cms",
  "contact",
  "dashboard",
  "demo",
  "email",
  "example",
  "favicon",
  "founder",
  "founders",
  "ftp",
  "help",
  "home",
  "hostmaster",
  "how-it-works",
  "imap",
  "index",
  "info",
  "js",
  "legal",
  "live-demo",
  "livedemo",
  "localhost",
  "login",
  "mail",
  "media",
  "netlify",
  "noreply",
  "null",
  "official",
  "owner",
  "partner",
  "partners",
  "payments",
  "policy",
  "pop",
  "postmaster",
  "press",
  "preview",
  "pricing",
  "privacy",
  "private",
  "public",
  "resend",
  "robots",
  "root",
  "sales",
  "security",
  "signal-pass",
  "signal-refinery",
  "signalpass",
  "signalrefinery",
  "signup",
  "sitemap",
  "smtp",
  "staff",
  "stripe",
  "support",
  "supabase",
  "system",
  "team",
  "terms",
  "undefined",
  "verify",
  "verification",
  "webmail",
  "www"
]);

const BLOCKED_PREFIXES = [
  "admin",
  "api",
  "billing",
  "official",
  "security",
  "signalpass",
  "signalrefinery",
  "staff",
  "support"
];

const REVIEW_PREFIXES = [
  "alderman",
  "attorneygeneral",
  "chief",
  "clerk",
  "commissioner",
  "comptroller",
  "councilman",
  "councilmember",
  "deputy",
  "director",
  "governor",
  "judge",
  "justice",
  "lieutenantgovernor",
  "ltgovernor",
  "marshal",
  "mayor",
  "officer",
  "policechief",
  "president",
  "prosecutor",
  "rep",
  "representative",
  "senator",
  "secretary",
  "sheriff",
  "speaker",
  "statesattorney",
  "superintendent",
  "treasurer",
  "trustee",
  "trooper"
];

const BLOCKED_ABUSE_TOKENS = new Set([
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "bullshit",
  "chink",
  "cock",
  "coon",
  "cunt",
  "damn",
  "dick",
  "douche",
  "dyke",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "gook",
  "hitler",
  "kike",
  "motherfucker",
  "nazi",
  "nigger",
  "penis",
  "perv",
  "piss",
  "prick",
  "pussy",
  "retard",
  "shit",
  "shitty",
  "slut",
  "spic",
  "tranny",
  "twat",
  "whore"
]);

function normalizeForAbuseCheck(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasBlockedPrefix(slug: string) {
  return BLOCKED_PREFIXES.some((prefix) => slug === prefix || slug.startsWith(`${prefix}-`));
}

function requiresReviewPrefix(normalizedForAbuse: string) {
  return REVIEW_PREFIXES.some(
    (prefix) => normalizedForAbuse === prefix || normalizedForAbuse.startsWith(prefix)
  );
}

export function classifySlug(input: string): SlugModerationResult {
  const normalized = slugify(input || "");
  const abuseNormalized = normalizeForAbuseCheck(input || "");

  if (!normalized) {
    return {
      normalized,
      state: "blocked",
      reason: "Enter a valid slug using letters, numbers, and hyphens."
    };
  }

  if (normalized.length < 3) {
    return {
      normalized,
      state: "blocked",
      reason: "Slugs must be at least 3 characters long."
    };
  }

  if (normalized.length > 40) {
    return {
      normalized,
      state: "blocked",
      reason: "Slugs must stay under 40 characters."
    };
  }

  if (BLOCKED_EXACT.has(normalized) || hasBlockedPrefix(normalized)) {
    return {
      normalized,
      state: "blocked",
      reason: "That slug is reserved and cannot be used."
    };
  }

  if (BLOCKED_ABUSE_TOKENS.has(abuseNormalized)) {
    return {
      normalized,
      state: "blocked",
      reason: "That slug is not allowed."
    };
  }

  if (requiresReviewPrefix(abuseNormalized)) {
    return {
      normalized,
      state: "review",
      reason: "This slug uses a government or official title and requires approval before it can go live."
    };
  }

  return {
    normalized,
    state: "allowed",
    reason: null
  };
}
