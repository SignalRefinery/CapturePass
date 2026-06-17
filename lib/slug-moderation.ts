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
  "resources",
  "robots",
  "root",
  "sales",
  "security",
  "signup",
  "sitemap",
  "smtp",
  "staff",
  "stripe",
  "support",
  "supabase",
  "system",
  "taptagg",
  "team",
  "terms",
  "undefined",
  "verify",
  "verification",
  "webmail",
  "springfield-il-contact-capture",
  "springfield-il-digital-business-cards",
  "springfield-il-nfc-business-cards",
  "springfield-il-sales-team-business-cards",
  "www"
]);

const BLOCKED_PREFIXES = [
  "admin",
  "api",
  "billing",
  "official",
  "security",
  "staff",
  "support",
  "taptagg"
];

const REVIEW_PREFIXES = [
  // Elected offices and legislative titles
  "alderman",
  "alderwoman",
  "assemblyman",
  "assemblymember",
  "assemblywoman",
  "assemblyperson",
  "boardmember",
  "chairman",
  "chairperson",
  "chairwoman",
  "chair",
  "commissioner",
  "congress",
  "congressman",
  "congressmember",
  "congressperson",
  "council",
  "councilman",
  "councilmember",
  "councilwoman",
  "councilperson",
  "delegate",
  "governor",
  "ltgovernor",
  "lieutenantgovernor",
  "mayor",
  "mp",
  "parliament",
  "president",
  "prime minister",
  "primeminister",
  "rep",
  "representative",
  "senator",
  "speaker",
  "spokesperson",
  "supervisor",
  "trustee",
  "vicepresident",

  // Executive, administrative, and constitutional offices
  "administrator",
  "administratorgeneral",
  "agency",
  "assessor",
  "attorneygeneral",
  "auditor",
  "cabinet",
  "chief",
  "clerk",
  "comptroller",
  "controller",
  "countyexecutive",
  "deputy",
  "director",
  "executive",
  "inspector",
  "inspectorgeneral",
  "manager",
  "ombudsman",
  "registrar",
  "secretary",
  "treasurer",
  "citymanager",

  // Courts, judges, prosecutors, and legal authority
  "attorney",
  "court",
  "da",
  "districtattorney",
  "hearingofficer",
  "judge",
  "justice",
  "magistrate",
  "prosecutor",
  "publicdefender",
  "statesattorney",
  "tribunal",

  // Public safety, military, and enforcement
  "captain",
  "chiefdeputy",
  "constable",
  "coroner",
  "detective",
  "ems",
  "fire",
  "firechief",
  "firedepartment",
  "firefighter",
  "firstresponder",
  "lawenforcement",
  "marshal",
  "officer",
  "police",
  "policechief",
  "policedepartment",
  "ranger",
  "sheriff",
  "trooper",
  "undersheriff",
  "warden",

  // Education and public boards
  "boardofeducation",
  "chancellor",
  "principal",
  "schoolboard",
  "schooldistrict",
  "superintendent",

  // Government entity / official-channel language
  "bureau",
  "city",
  "cityhall",
  "cityof",
  "county",
  "countyof",
  "civic",
  "department",
  "dept",
  "federal",
  "gov",
  "government",
  "municipal",
  "municipality",
  "officeof",
  "officialaccount",
  "officialpage",
  "publicauthority",
  "publicoffice",
  "state",
  "stateof",
  "town",
  "township",
  "village",

  // Campaign, candidate, and political committee language
  "ballot",
  "campaign",
  "campaignteam",
  "campaignoffice",
  "candidate",
  "committee",
  "election",
  "elect",
  "reelect",
  "reelection",
  "vote",

  // Verification / impersonation-prone language
  "actual",
  "authentic",
  "certified",
  "confirmed",
  "legit",
  "real",
  "theofficial",
  "true",
  "verified"
];

const REVIEW_CONTAINS = [
  "foralderman",
  "foralderwoman",
  "forassembly",
  "forcommissioner",
  "forcongress",
  "forcongressperson",
  "forcouncil",
  "fordelegate",
  "forgovernor",
  "forjudge",
  "formayor",
  "foroffice",
  "forpresident",
  "forrep",
  "forrepresentative",
  "forsenate",
  "forsenator",
  "forsheriff",
  "fortreasurer",
  "official",
  "officialaccount",
  "officialsite",
  "verified",
  "verifiedaccount",
  "realaccount",
  "office",
  "team",
  "thisis",
  "iam",
  "theofficial",
  "vote",
  "elect",
  "reelect",
  "cityof",
  "countyof",
  "stateof",
  "police",
  "sheriff",
  "governor",
  "senator",
  "mayor",
  "president",
  "gov",
  "government"
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

const BLOCKED_ABUSE_CONTAINS = [
  "heilhitler",
  "whitepower",
  "whitesupremacy",
  "killjews",
  "killblack",
  "killmuslims",
  "killgays"
];

const IMPERSONATION_IDENTITY_SIGNALS = [
  "actual",
  "authentic",
  "certified",
  "confirmed",
  "iam",
  "legit",
  "official",
  "officialaccount",
  "officialpage",
  "officialsite",
  "real",
  "realaccount",
  "theofficial",
  "thisis",
  "true",
  "verified",
  "verifiedaccount"
];

const IMPERSONATION_OFFICE_SIGNALS = [
  "alderman",
  "alderwoman",
  "assemblymember",
  "assemblyperson",
  "commissioner",
  "congress",
  "congressman",
  "congressmember",
  "congressperson",
  "congresswoman",
  "council",
  "councilmember",
  "councilperson",
  "governor",
  "judge",
  "mayor",
  "police",
  "policechief",
  "president",
  "rep",
  "representative",
  "senator",
  "sheriff",
  "statesattorney",
  "treasurer"
];

const IMPERSONATION_ENTITY_SIGNALS = [
  "cityof",
  "countyof",
  "department",
  "dept",
  "federal",
  "gov",
  "government",
  "municipal",
  "municipality",
  "office",
  "officeof",
  "publicauthority",
  "publicoffice",
  "schoolboard",
  "stateof"
];

const IMPERSONATION_CAMPAIGN_SIGNALS = [
  "campaign",
  "campaignoffice",
  "campaignteam",
  "candidate",
  "committee",
  "elect",
  "foroffice",
  "reelect",
  "reelection",
  "team",
  "vote"
];

function normalizeForAbuseCheck(value: string) {
  return value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/!/g, "i")
    .replace(/\+/g, "t")
    .replace(/[^a-z0-9]/g, "")
    .replace(/(.)\1{2,}/g, "$1$1");
}

function normalizeToSingleCharacters(value: string) {
  return normalizeForAbuseCheck(value).replace(/(.)\1+/g, "$1");
}

function editDistanceAtMostOne(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;

    if (a.length > b.length) {
      i += 1;
    } else if (b.length > a.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  if (i < a.length || j < b.length) edits += 1;
  return edits <= 1;
}

function containsAny(normalizedForAbuse: string, terms: string[]) {
  return terms.some((term) => normalizedForAbuse.includes(normalizeForAbuseCheck(term)));
}

function hasBlockedAbuse(normalizedForAbuse: string) {
  const singleCharNormalized = normalizeToSingleCharacters(normalizedForAbuse);

  if (BLOCKED_ABUSE_CONTAINS.some((term) => normalizedForAbuse.includes(normalizeForAbuseCheck(term)))) {
    return true;
  }

  for (const token of BLOCKED_ABUSE_TOKENS) {
    const normalizedToken = normalizeForAbuseCheck(token);
    const singleCharToken = normalizeToSingleCharacters(token);

    if (normalizedForAbuse === normalizedToken || singleCharNormalized === singleCharToken) {
      return true;
    }

    if (
      normalizedToken.length >= 5 &&
      (normalizedForAbuse.includes(normalizedToken) || singleCharNormalized.includes(singleCharToken))
    ) {
      return true;
    }

    if (
      normalizedToken.length >= 5 &&
      Math.abs(singleCharNormalized.length - singleCharToken.length) <= 1 &&
      editDistanceAtMostOne(singleCharNormalized, singleCharToken)
    ) {
      return true;
    }
  }

  return false;
}

function looksLikeImpersonation(normalizedForAbuse: string) {
  const hasIdentitySignal = containsAny(normalizedForAbuse, IMPERSONATION_IDENTITY_SIGNALS);
  const hasOfficeSignal = containsAny(normalizedForAbuse, IMPERSONATION_OFFICE_SIGNALS);
  const hasEntitySignal = containsAny(normalizedForAbuse, IMPERSONATION_ENTITY_SIGNALS);
  const hasCampaignSignal = containsAny(normalizedForAbuse, IMPERSONATION_CAMPAIGN_SIGNALS);

  if (hasOfficeSignal || hasEntitySignal || hasCampaignSignal) return true;
  if (hasIdentitySignal && normalizedForAbuse.length >= 8) return true;

  return false;
}

function hasBlockedPrefix(slug: string) {
  return BLOCKED_PREFIXES.some((prefix) => slug === prefix || slug.startsWith(`${prefix}-`));
}

function requiresReviewPrefix(normalizedForAbuse: string) {
  return REVIEW_PREFIXES.some((prefix) => {
    const normalizedPrefix = normalizeForAbuseCheck(prefix);
    return (
      normalizedForAbuse === normalizedPrefix ||
      normalizedForAbuse.startsWith(normalizedPrefix)
    );
  });
}

function requiresReviewContains(normalizedForAbuse: string) {
  return REVIEW_CONTAINS.some((term) => {
    const normalizedTerm = normalizeForAbuseCheck(term);
    return normalizedForAbuse.includes(normalizedTerm);
  });
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

  if (hasBlockedAbuse(abuseNormalized)) {
    return {
      normalized,
      state: "blocked",
      reason: "That slug is not allowed."
    };
  }

  if (
    requiresReviewPrefix(abuseNormalized) ||
    requiresReviewContains(abuseNormalized) ||
    looksLikeImpersonation(abuseNormalized)
  ) {
    return {
      normalized,
      state: "review",
      reason:
        "This slug could be confused with a public official, campaign, government office, public agency, or verified identity and requires approval before it can go live."
    };
  }

  return {
    normalized,
    state: "allowed",
    reason: null
  };
}

export function isSlugPubliclyAllowed(slug?: string | null, status?: string | null) {
  if (!slug) return false;

  const moderation = classifySlug(slug);

  if (moderation.state === "blocked") return false;

  // Review-required slugs may only be exposed after an explicit admin approval.
  if (moderation.state === "review") return status === "approved";

  return !status || status === "approved";
}
