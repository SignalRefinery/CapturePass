export type ContactPayload = {
  profileId?: string | null;
  slug?: string | null;
  viewId?: string | null;
  organizationId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  note?: string | null;
  source?: string | null;
  website?: string | null;
  consent_to_contact?: boolean | string | null;
  consent_text?: string | null;
};

export type AnalyticsEventPayload = {
  event_type?: string;
  profile_id?: string;
  slug?: string;
  organization_id?: string;
  organization_member_id?: string;
  profile_view_id?: string;
  card_id?: string;
  action_type?: string;
  action_label?: string;
  action_url?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type ProfileReportPayload = {
  profileId: string;
  slug: string;
  reason: string;
};

const CONTACT_PAYLOAD_KEYS = new Set([
  "profileId",
  "slug",
  "viewId",
  "organizationId",
  "name",
  "email",
  "phone",
  "company",
  "title",
  "note",
  "source",
  "website",
  "consent_to_contact",
  "consent_text"
]);

const CONTACT_STRING_FIELDS = [
  "profileId",
  "slug",
  "viewId",
  "organizationId",
  "name",
  "email",
  "phone",
  "company",
  "title",
  "note",
  "source",
  "website",
  "consent_text"
];

const ANALYTICS_PAYLOAD_KEYS = new Set([
  "event_type",
  "profile_id",
  "slug",
  "organization_id",
  "organization_member_id",
  "profile_view_id",
  "card_id",
  "action_type",
  "action_label",
  "action_url",
  "source",
  "metadata"
]);

export function parseContactPayload(value: unknown): ContactPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  if (!Object.keys(raw).every((key) => CONTACT_PAYLOAD_KEYS.has(key))) {
    return null;
  }

  for (const field of CONTACT_STRING_FIELDS) {
    if (raw[field] !== undefined && raw[field] !== null && typeof raw[field] !== "string") {
      return null;
    }
  }

  if (
    raw.consent_to_contact !== undefined &&
    raw.consent_to_contact !== null &&
    typeof raw.consent_to_contact !== "boolean" &&
    typeof raw.consent_to_contact !== "string"
  ) {
    return null;
  }

  return raw as ContactPayload;
}

export function parseAnalyticsPayload(value: unknown): AnalyticsEventPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  if (!Object.keys(raw).every((key) => ANALYTICS_PAYLOAD_KEYS.has(key))) {
    return null;
  }

  for (const [key, fieldValue] of Object.entries(raw)) {
    if (key === "metadata") {
      if (
        fieldValue !== undefined &&
        fieldValue !== null &&
        (typeof fieldValue !== "object" || Array.isArray(fieldValue))
      ) {
        return null;
      }
      continue;
    }

    if (fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== "string") {
      return null;
    }
  }

  return raw as AnalyticsEventPayload;
}

export function parseProfileReportPayload(value: unknown): ProfileReportPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const allowedKeys = new Set(["profileId", "slug", "reason"]);
  if (!Object.keys(raw).every((key) => allowedKeys.has(key))) {
    return null;
  }

  const profileId = typeof raw.profileId === "string" ? raw.profileId.trim() : "";
  const slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";

  if (!slug || !reason || reason.length > 1200) {
    return null;
  }

  return { profileId, slug, reason };
}
