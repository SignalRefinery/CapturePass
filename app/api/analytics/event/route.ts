import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics/record-event";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeGamificationEventType } from "@/lib/gamification/event-normalizer";
import { getPublicProfileBySlug } from "@/lib/profiles/public-profile-source";
import { parseAnalyticsPayload } from "@/lib/validation/api-payloads";

const EVENT_TYPES = new Set([
  "profile_view",
  "profileViewed",
  "page_view",
  "qr_scan",
  "qrScan",
  "qr_open",
  "nfc_tap",
  "direct_visit",
  "shared_link_visit",
  "button_click",
  "email_click",
  "phone_click",
  "website_click",
  "social_click",
  "appointment_click",
  "manual_follow_up_logged",
  "sale_logged",
  "revenue_logged",
  "vcard_download",
  "contact_save",
  "contact_shared",
  "contact_submission",
  "card_assigned",
  "card_reassigned",
  "employee_activated",
  "employee_deactivated"
]);

const SOURCES = new Set(["nfc", "qr", "direct", "shared_link", "dashboard_preview", "unknown", "public_profile", "business_profile"]);
const ACTION_TYPES = new Set([
  "call",
  "text",
  "email",
  "website",
  "linkedin",
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "calendly",
  "review_link",
  "custom_button",
  "other"
]);
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function cleanText(value: unknown, max = 180) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanUrl(value: unknown) {
  const url = cleanText(value, 400);
  if (!url) return null;
  if (url.startsWith("/") || /^https?:\/\//i.test(url) || /^mailto:|^tel:|^sms:/i.test(url)) {
    return url;
  }
  return null;
}

function isUuid(value?: string | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function sourceFor(value: string) {
  if (value === "share") return "shared_link";
  return SOURCES.has(value) ? value : "unknown";
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

function hashIp(ip: string) {
  const salt = process.env.ANALYTICS_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "taptagg";
  return ip ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 80) return false;
  current.count += 1;
  return true;
}

function metadataFor(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 2000) return {};
  return JSON.parse(json) as Record<string, unknown>;
}

export async function POST(request: Request) {
  const payload = parseAnalyticsPayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventType = cleanText(payload.event_type, 60);
  const normalizedEventType = normalizeGamificationEventType(eventType) || eventType;

  if (!EVENT_TYPES.has(eventType) && !EVENT_TYPES.has(normalizedEventType)) {
    return NextResponse.json({ ok: false, error: "Invalid event type." }, { status: 400 });
  }

  const profileId = cleanText(payload.profile_id, 64) || null;
  const slug = cleanText(payload.slug, 80).toLowerCase() || null;
  const organizationId = cleanText(payload.organization_id, 64) || null;
  const organizationMemberId = cleanText(payload.organization_member_id, 64) || null;
  const profileViewId = cleanText(payload.profile_view_id, 64) || null;
  const cardId = cleanText(payload.card_id, 64) || null;

  if (
    (profileId && !isUuid(profileId)) ||
    (organizationId && !isUuid(organizationId)) ||
    (organizationMemberId && !isUuid(organizationMemberId)) ||
    (profileViewId && !isUuid(profileViewId)) ||
    (cardId && !isUuid(cardId))
  ) {
    return NextResponse.json({ ok: false, error: "Invalid analytics target." }, { status: 400 });
  }

  const visitorCookie = request.headers.get("cookie")?.match(/(?:^|;\s*)tt_vid=([^;]+)/)?.[1];
  const sessionCookie = request.headers.get("cookie")?.match(/(?:^|;\s*)tt_sid=([^;]+)/)?.[1];
  const visitorId = visitorCookie || randomUUID();
  const sessionId = sessionCookie || randomUUID();
  const ip = clientIp(request);
  const rateKey = `${ip || visitorId}:${profileId || organizationMemberId || slug || "unknown"}`;

  if (!checkRateLimit(rateKey)) {
    return NextResponse.json({ ok: true });
  }

  let resolvedProfileId = profileId;
  let submittedUserId: string | null = null;
  let locationId: string | null = null;
  let regionId: string | null = null;
  const admin = createAdminClient();

  if (!resolvedProfileId && slug) {
    const profile = await getPublicProfileBySlug(slug);
    resolvedProfileId = profile?.id || null;
    submittedUserId = profile?.user_id || null;
  }

  if (resolvedProfileId && !submittedUserId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("id", resolvedProfileId)
      .maybeSingle();
    submittedUserId = profile?.user_id || null;
  }

  if (organizationMemberId && !submittedUserId) {
    const { data: member } = await admin
      .from("organization_members")
      .select("user_id, location_id")
      .eq("id", organizationMemberId)
      .maybeSingle();
    submittedUserId = member?.user_id || null;
    locationId = member?.location_id || null;
  }

  if (locationId) {
    const { data: location } = await admin
      .from("business_locations")
      .select("id, region_id")
      .eq("id", locationId)
      .maybeSingle();
    regionId = location?.region_id || null;
  }

  const actionType = cleanText(payload.action_type, 80);
  const safeActionType = ACTION_TYPES.has(actionType) ? actionType : actionType ? "other" : null;
  const source = sourceFor(cleanText(payload.source, 80));

  const { error } = await recordAnalyticsEvent({
    event_type: normalizeGamificationEventType(eventType) || eventType,
    profile_id: resolvedProfileId,
    organization_id: organizationId,
    organization_member_id: organizationMemberId,
    location_id: locationId,
    region_id: regionId,
    profile_view_id: profileViewId,
    user_id: submittedUserId,
    card_id: cardId,
    source,
    action_type: safeActionType,
    action_label: cleanText(payload.action_label, 120) || null,
    action_url: cleanUrl(payload.action_url),
    visitor_id: visitorId,
    session_id: sessionId,
    user_agent: cleanText(request.headers.get("user-agent"), 300) || null,
    referrer: cleanText(request.headers.get("referer"), 400) || null,
    ip_hash: hashIp(ip),
    metadata: metadataFor(payload.metadata)
  }, {
    client: admin,
    logContext: {
      eventType,
      profileId: resolvedProfileId,
      organizationId,
      organizationMemberId
    }
  });

  if (error) {
    return NextResponse.json({ ok: true });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("tt_vid", visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  response.cookies.set("tt_sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 30,
    path: "/"
  });
  return response;
}
