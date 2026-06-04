import type { AnalyticsEventRecord, GamificationMetricKey, GamificationScoreBreakdown } from "@/lib/types";
import { normalizeGamificationEventType, normalizeGamificationMetricKey } from "@/lib/gamification/event-normalizer";

const POINT_VALUES: Partial<Record<GamificationMetricKey | string, number>> = {
  qr_scan: 2,
  vcard_download: 3,
  email_click: 4,
  phone_click: 5,
  website_click: 4,
  social_click: 3,
  contact_submission: 10,
  contact_shared: 10,
  appointment_click: 15,
  calendar_click: 15,
  manual_follow_up_logged: 8,
  sale_logged: 50,
  revenue_logged: 25,
  nfc_tap: 2,
  button_click: 1,
  direct_visit: 1,
  shared_link_visit: 1
};

const METRIC_EVENT_MAP: Record<GamificationMetricKey, string[]> = {
  contacts_captured: ["contact_submission", "contact_shared"],
  profile_views: ["profile_view"],
  qr_scans: ["qr_scan"],
  taptagg_score: [],
  active_streak: [],
  monthly_score: [],
  appointment_actions: ["appointment_click", "calendar_click", "manual_follow_up_logged"],
  sales_logged: ["sale_logged"],
  revenue_logged: ["revenue_logged"]
};

function cleanDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function utcDayKey(value?: string | Date | null) {
  const date = cleanDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function getEventPointValue(eventType?: string | null) {
  const normalized = normalizeGamificationEventType(eventType) || eventType?.trim().toLowerCase() || "";
  return POINT_VALUES[normalized] || 0;
}

export function calculateTapTaggScore(events: Array<Pick<AnalyticsEventRecord, "event_type" | "action_type" | "created_at">>) {
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const event of events) {
    const eventType = normalizeGamificationEventType(event.event_type) || event.event_type;
    const points = getEventPointValue(eventType);
    if (!points) continue;

    const key = eventType || "unknown";
    breakdown[key] = (breakdown[key] || 0) + points;
    total += points;
  }

  return {
    total,
    breakdown
  } satisfies GamificationScoreBreakdown;
}

export function normalizeMetricMetricKey(metricKey?: string | null) {
  return normalizeGamificationMetricKey(metricKey) || "taptagg_score";
}

export function calculateMetricValue(
  metricKey: GamificationMetricKey | string,
  options: {
    analyticsEvents?: Array<Pick<AnalyticsEventRecord, "event_type" | "action_type" | "created_at">>;
    contactCount?: number;
    salesCount?: number;
    revenueLogged?: number;
    activeStreak?: number;
    monthlyScore?: number;
  } = {}
) {
  const normalizedMetric = normalizeMetricMetricKey(metricKey);

  switch (normalizedMetric) {
    case "contacts_captured":
      return options.contactCount || 0;
    case "profile_views":
      return options.analyticsEvents?.filter((event) => normalizeGamificationEventType(event.event_type) === "profile_view").length || 0;
    case "qr_scans":
      return options.analyticsEvents?.filter((event) => normalizeGamificationEventType(event.event_type) === "qr_scan").length || 0;
    case "appointment_actions":
      return options.analyticsEvents?.filter((event) => {
        const eventType = normalizeGamificationEventType(event.event_type);
        return eventType === "appointment_click" || eventType === "calendar_click" || eventType === "manual_follow_up_logged";
      }).length || 0;
    case "sales_logged":
      return options.salesCount || 0;
    case "revenue_logged":
      return options.revenueLogged || 0;
    case "active_streak":
      return options.activeStreak || 0;
    case "monthly_score":
      return options.monthlyScore || 0;
    case "taptagg_score":
    default:
      return calculateTapTaggScore(options.analyticsEvents || []).total;
  }
}

export function calculateStreak(events: Array<{ created_at?: string | null }>, now = new Date()) {
  const uniqueDays = new Set(events.map((event) => utcDayKey(event.created_at)).filter(Boolean) as string[]);
  if (!uniqueDays.size) return 0;

  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let streak = 0;

  while (true) {
    const dayKey = cursor.toISOString().slice(0, 10);
    if (!uniqueDays.has(dayKey)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function calculateMonthlyScoreFromEvents(
  events: Array<Pick<AnalyticsEventRecord, "event_type" | "created_at">>,
  month: string
) {
  const prefix = `${month}-`;
  return calculateTapTaggScore(events.filter((event) => (event.created_at || "").startsWith(prefix))).total;
}

export function calculateMetricProgress(
  metricKey: GamificationMetricKey | string,
  currentValue: number,
  thresholdValue: number | null | undefined
) {
  const target = thresholdValue || 0;
  return {
    metricKey: normalizeMetricMetricKey(metricKey),
    currentValue,
    thresholdValue: target,
    percent: target ? Math.min(100, Math.round((currentValue / target) * 100)) : 0
  };
}

export function dayKeysBetween(start: Date, end: Date) {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
