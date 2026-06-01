import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnalyticsEventRecord,
  BadgeDefinition,
  ChallengeProgress,
  Competition,
  CompetitionResult,
  ContactSubmissionRecord,
  GamificationMetricKey,
  LeaderboardRow,
  SalesAttributionEvent,
  TeamChallenge,
  UserBadge
} from "@/lib/types";
import {
  calculateMetricValue,
  calculateMonthlyScoreFromEvents,
  calculateStreak,
  calculateTapTaggScore,
  dayKeysBetween,
  normalizeMetricMetricKey
} from "@/lib/gamification/scoring";
import { normalizeGamificationEventType } from "@/lib/gamification/event-normalizer";

type TableResponse<T> = { data: T[] | null; error?: { message?: string; code?: string } | null };
type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

const DEFAULT_BADGE_DEFINITIONS: Omit<BadgeDefinition, "id" | "created_at">[] = [
  {
    badge_key: "first_contact",
    name: "First Contact Captured",
    description: "Captured your first shared contact.",
    category: "individual",
    icon: "contact",
    point_bonus: 25,
    threshold_value: 1,
    metric_key: "contacts_captured",
    is_active: true
  },
  {
    badge_key: "contact_starter",
    name: "Contact Starter",
    description: "Captured 10 contacts.",
    category: "individual",
    icon: "contacts",
    point_bonus: 50,
    threshold_value: 10,
    metric_key: "contacts_captured",
    is_active: true
  },
  {
    badge_key: "networking_machine",
    name: "Networking Machine",
    description: "Captured 100 contacts.",
    category: "individual",
    icon: "network",
    point_bonus: 250,
    threshold_value: 100,
    metric_key: "contacts_captured",
    is_active: true
  },
  {
    badge_key: "first_100_views",
    name: "First 100 Views",
    description: "Reached 100 profile views.",
    category: "individual",
    icon: "views",
    point_bonus: 25,
    threshold_value: 100,
    metric_key: "profile_views",
    is_active: true
  },
  {
    badge_key: "qr_getter",
    name: "QR Getter",
    description: "Reached 50 QR scans.",
    category: "individual",
    icon: "qr",
    point_bonus: 50,
    threshold_value: 50,
    metric_key: "qr_scans",
    is_active: true
  },
  {
    badge_key: "follow_up_pro",
    name: "Follow-Up Pro",
    description: "Logged activity or captured contacts 30 days in a row.",
    category: "individual",
    icon: "streak",
    point_bonus: 250,
    threshold_value: 30,
    metric_key: "active_streak",
    is_active: true
  },
  {
    badge_key: "seven_day_streak",
    name: "7-Day Streak",
    description: "Used TapTagg 7 days in a row.",
    category: "individual",
    icon: "fire",
    point_bonus: 50,
    threshold_value: 7,
    metric_key: "active_streak",
    is_active: true
  },
  {
    badge_key: "monthly_hustler",
    name: "Monthly Hustler",
    description: "Scored 500 points in a calendar month.",
    category: "individual",
    icon: "score",
    point_bonus: 100,
    threshold_value: 500,
    metric_key: "monthly_score",
    is_active: true
  },
  {
    badge_key: "closer_signal",
    name: "Closer Signal",
    description: "Logged a sale connected to TapTagg.",
    category: "individual",
    icon: "sale",
    point_bonus: 100,
    threshold_value: 1,
    metric_key: "sales_logged",
    is_active: true
  },
  {
    badge_key: "appointment_setter",
    name: "Appointment Setter",
    description: "Generated or logged 10 appointment actions.",
    category: "individual",
    icon: "calendar",
    point_bonus: 100,
    threshold_value: 10,
    metric_key: "appointment_actions",
    is_active: true
  },
  {
    badge_key: "top_performer_week",
    name: "Top Performer This Week",
    description: "Ranked #1 on the weekly team leaderboard.",
    category: "team",
    icon: "trophy",
    point_bonus: 150,
    threshold_value: 1,
    metric_key: "weekly_rank",
    is_active: true
  },
  {
    badge_key: "top_performer_month",
    name: "Top Performer This Month",
    description: "Ranked #1 on the monthly team leaderboard.",
    category: "team",
    icon: "trophy",
    point_bonus: 300,
    threshold_value: 1,
    metric_key: "monthly_rank",
    is_active: true
  },
  {
    badge_key: "team_goal_crusher",
    name: "Team Goal Crusher",
    description: "Contributed to a completed team challenge.",
    category: "team",
    icon: "rocket",
    point_bonus: 100,
    threshold_value: 1,
    metric_key: "challenge_completed",
    is_active: true
  }
];

export function appMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthBounds(month: string) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

function isMissingTable(error?: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || /does not exist/i.test(error?.message || "");
}

function pseudoEventTypeFromAttribution(type: SalesAttributionEvent["attribution_type"]) {
  switch (type) {
    case "appointment_booked":
      return "appointment_click";
    case "follow_up_logged":
      return "manual_follow_up_logged";
    case "opportunity_created":
      return "manual_follow_up_logged";
    case "sale_logged":
      return "sale_logged";
    case "revenue_logged":
      return "revenue_logged";
    default:
      return "manual_follow_up_logged";
  }
}

function normalizeSalesEvents(events: SalesAttributionEvent[]): AnalyticsEventRecord[] {
  return events.map((event) => ({
    id: event.id,
    event_type: pseudoEventTypeFromAttribution(event.attribution_type),
    profile_id: event.profile_id || null,
    organization_id: event.organization_id || null,
    organization_member_id: null,
    profile_view_id: null,
    user_id: event.owner_user_id || null,
    card_id: null,
    source: event.source || "manual",
    action_type: event.attribution_type,
    action_label: event.deal_name || event.customer_name || event.attribution_type,
    action_url: null,
    visitor_id: null,
    session_id: null,
    user_agent: null,
    referrer: null,
    ip_hash: null,
    metadata: {
      revenue_amount: event.revenue_amount,
      notes: event.notes,
      contact_submission_id: event.contact_submission_id
    },
    created_at: event.occurred_at || event.created_at || new Date().toISOString()
  }));
}

async function safeSelect<T>(query: unknown) {
  try {
    const resolved = (await query) as TableResponse<T> | null;
    if (resolved?.error && isMissingTable(resolved.error)) {
      return [] as T[];
    }
    return (resolved?.data || []) as T[];
  } catch (error) {
    console.error("gamification query failed", {
      error: error instanceof Error ? error.message : "Unknown query error"
    });
    return [] as T[];
  }
}

export function previousMonthKey(date = new Date()) {
  return appMonthKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)));
}

function utcDateEnd(value: string) {
  return `${value}T23:59:59.999Z`;
}

async function listBadgeDefinitions(admin = createAdminClient()) {
  const definitions = await safeSelect<BadgeDefinition>(
    admin.from("gamification_badge_definitions").select("*").eq("is_active", true)
  );
  return definitions.length ? definitions : DEFAULT_BADGE_DEFINITIONS.map((definition, index) => ({
    id: `seed-${index}`,
    created_at: undefined,
    ...definition
  }));
}

async function listUserBadges(userId: string, admin = createAdminClient()) {
  return safeSelect<UserBadge>(admin.from("gamification_user_badges").select("*").eq("user_id", userId));
}

async function listPersonalEvents({
  userId,
  profileId,
  admin = createAdminClient()
}: {
  userId: string;
  profileId?: string | null;
  admin?: ReturnType<typeof createAdminClient>;
}) {
  const [analyticsByUser, analyticsByProfile, contactsByUser, contactsByProfile, sales] = await Promise.all([
    safeSelect<AnalyticsEventRecord>(
      admin.from("analytics_events").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ),
    profileId
      ? safeSelect<AnalyticsEventRecord>(
          admin.from("analytics_events").select("*").eq("profile_id", profileId).order("created_at", { ascending: false })
        )
      : Promise.resolve([] as AnalyticsEventRecord[]),
    safeSelect<ContactSubmissionRecord>(
      admin.from("contact_submissions").select("*").eq("submitted_to_user_id", userId).order("created_at", { ascending: false })
    ),
    profileId
      ? safeSelect<ContactSubmissionRecord>(
          admin.from("contact_submissions").select("*").eq("profile_id", profileId).order("created_at", { ascending: false })
        )
      : Promise.resolve([] as ContactSubmissionRecord[]),
    safeSelect<SalesAttributionEvent>(
      admin.from("sales_attribution_events").select("*").eq("owner_user_id", userId).order("occurred_at", { ascending: false })
    )
  ]);

  const analyticsMap = new Map<string, AnalyticsEventRecord>();
  [...analyticsByUser, ...analyticsByProfile].forEach((event) => analyticsMap.set(event.id, event));

  const contactMap = new Map<string, ContactSubmissionRecord>();
  [...contactsByUser, ...contactsByProfile].forEach((contact) => contactMap.set(contact.id, contact));

  const allAnalytics = [...analyticsMap.values()];
  const allContacts = [...contactMap.values()];
  const salesEvents = normalizeSalesEvents(sales);

  return {
    analyticsEvents: [...allAnalytics, ...salesEvents],
    contactSubmissions: allContacts,
    salesAttributionEvents: sales
  };
}

export async function calculateMonthlyScore(
  userId: string,
  month = appMonthKey(),
  options: { profileId?: string | null; admin?: ReturnType<typeof createAdminClient> } = {}
) {
  const admin = options.admin || createAdminClient();
  const { analyticsEvents } = await listPersonalEvents({
    userId,
    profileId: options.profileId,
    admin
  });

  const { start, end } = monthBounds(month);
  const windowedEvents = analyticsEvents.filter((event) => {
    const createdAt = event.created_at || "";
    return createdAt >= start && createdAt <= end;
  });

  const score = calculateTapTaggScore(windowedEvents).total;
  return score;
}

export async function calculateOrganizationLeaderboard(
  organizationId: string,
  month = appMonthKey(),
  options: { admin?: ReturnType<typeof createAdminClient> } = {}
) {
  const { start, end } = monthBounds(month);
  return calculateOrganizationLeaderboardForRange(organizationId, start, end, options);
}

export async function calculateOrganizationLeaderboardForRange(
  organizationId: string,
  start: string,
  end: string,
  options: { admin?: SupabaseAdminClient } = {}
) {
  const admin = options.admin || createAdminClient();
  const [members, analyticsEvents, contacts, sales] = await Promise.all([
    safeSelect<{
      id: string;
      organization_id: string;
      user_id?: string | null;
      name: string;
      role: string;
      status: string;
      title?: string | null;
    }>(admin.from("organization_members").select("id, organization_id, user_id, name, role, status, title").eq("organization_id", organizationId).eq("status", "active")),
    safeSelect<AnalyticsEventRecord>(
      admin.from("analytics_events").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false })
    ),
    safeSelect<ContactSubmissionRecord>(
      admin.from("contact_submissions").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false })
    ),
    safeSelect<SalesAttributionEvent>(
      admin.from("sales_attribution_events").select("*").eq("organization_id", organizationId).order("occurred_at", { ascending: false })
    )
  ]);

  const filteredAnalytics = analyticsEvents.filter((event) => {
    const createdAt = event.created_at || "";
    return createdAt >= start && createdAt <= end;
  });
  const filteredContacts = contacts.filter((contact) => {
    const createdAt = contact.created_at || "";
    return createdAt >= start && createdAt <= end;
  });
  const filteredSales = sales.filter((event) => {
    const createdAt = event.occurred_at || event.created_at || "";
    return createdAt >= start && createdAt <= end;
  });

  const rows = members.map((member, index) => {
    const memberEvents = filteredAnalytics.filter((event) => event.organization_member_id === member.id || event.user_id === member.user_id);
    const memberContacts = filteredContacts.filter((contact) => contact.profile_id === member.id || contact.submitted_to_user_id === member.user_id);
    const memberSales = filteredSales.filter((event) => event.owner_user_id === member.user_id);
    const normalizedSalesEvents = normalizeSalesEvents(memberSales);
    const score = calculateTapTaggScore([...memberEvents, ...normalizedSalesEvents]).total;
    const revenueLogged = memberSales.reduce((total, event) => total + Number(event.revenue_amount || 0), 0);

    return {
      rank: index + 1,
      user_id: member.user_id || member.id,
      name: member.name,
      organization_member_id: member.id,
      contacts_captured: memberContacts.length,
      profile_views: memberEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "profile_view").length,
      qr_scans: memberEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "qr_scan").length,
      phone_clicks: memberEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "phone_click").length,
      appointment_clicks: memberEvents.filter((event) => {
        const eventType = normalizeGamificationEventType(event.event_type);
        return eventType === "appointment_click" || eventType === "calendar_click" || eventType === "manual_follow_up_logged";
      }).length,
      sales_logged: memberSales.filter((event) => event.attribution_type === "sale_logged").length,
      revenue_logged: revenueLogged,
      taptagg_score: score
    } satisfies LeaderboardRow;
  });

  return rows
    .sort((a, b) => b.taptagg_score - a.taptagg_score || b.contacts_captured - a.contacts_captured || a.name.localeCompare(b.name))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function leaderboardMetricValue(row: LeaderboardRow, metricKey?: string | null) {
  switch (normalizeMetricMetricKey(metricKey || "taptagg_score")) {
    case "contacts_captured":
      return row.contacts_captured;
    case "profile_views":
      return row.profile_views;
    case "qr_scans":
      return row.qr_scans;
    case "appointment_actions":
      return row.appointment_clicks;
    case "sales_logged":
      return row.sales_logged;
    case "revenue_logged":
      return row.revenue_logged;
    case "taptagg_score":
    default:
      return row.taptagg_score;
  }
}

export async function calculateChallengeProgress(
  challenge: Pick<TeamChallenge, "organization_id" | "metric_key" | "goal_value" | "start_date" | "end_date">,
  options: { admin?: SupabaseAdminClient; now?: Date } = {}
) {
  const now = options.now || new Date();
  const endDate = new Date(challenge.end_date);
  const effectiveEnd = now < endDate ? now.toISOString() : utcDateEnd(challenge.end_date);
  const leaderboard = await calculateOrganizationLeaderboardForRange(
    challenge.organization_id,
    `${challenge.start_date}T00:00:00.000Z`,
    effectiveEnd,
    { admin: options.admin }
  );
  const progressValue = leaderboard.reduce((total, row) => total + leaderboardMetricValue(row, challenge.metric_key), 0);

  return {
    leaderboard,
    progressValue,
    percent: challenge.goal_value ? Math.min(100, Math.round((progressValue / challenge.goal_value) * 100)) : 0
  };
}

export async function awardEligibleBadges({
  userId,
  profileId,
  organizationId,
  month = appMonthKey(),
  admin = createAdminClient()
}: {
  userId: string;
  profileId?: string | null;
  organizationId?: string | null;
  month?: string;
  admin?: ReturnType<typeof createAdminClient>;
}) {
  const { analyticsEvents, contactSubmissions, salesAttributionEvents } = await listPersonalEvents({ userId, profileId, admin });
  const monthScore = await calculateMonthlyScore(userId, month, { profileId, admin });
  const streak = calculateStreak(analyticsEvents);
  const allTimeScore = calculateTapTaggScore(analyticsEvents).total;
  const salesLogged = salesAttributionEvents.filter((event) => event.attribution_type === "sale_logged").length;
  const revenueLogged = salesAttributionEvents.reduce((total, event) => total + Number(event.revenue_amount || 0), 0);
  const definitions = await listBadgeDefinitions(admin);
  const existingBadges = await listUserBadges(userId, admin);
  const existingKeys = new Set(existingBadges.map((badge) => `${badge.badge_key}:${badge.period_start || ""}:${badge.period_end || ""}`));
  const currentMonthStart = `${month}-01T00:00:00.000Z`;
  const currentMonthEnd = monthBounds(month).end;

  const metricValueByKey: Record<string, number> = {
    contacts_captured: contactSubmissions.length,
    profile_views: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "profile_view").length,
    qr_scans: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "qr_scan").length,
    active_streak: streak,
    monthly_score: monthScore,
    sales_logged: salesLogged,
    revenue_logged: revenueLogged,
    appointment_actions: calculateMetricValue("appointment_actions", { analyticsEvents })
  };

  const orgLeaderboard = organizationId ? await calculateOrganizationLeaderboard(organizationId, month, { admin }) : [];
  const teamRank = orgLeaderboard.find((row) => row.user_id === userId || row.organization_member_id === profileId)?.rank || null;
  const achievementEligible: Array<{ definition: BadgeDefinition; period_start?: string | null; period_end?: string | null; metadata?: Record<string, unknown> }> = [];

  for (const definition of definitions) {
    const threshold = Number(definition.threshold_value || 0);
    const metricValue = metricValueByKey[normalizeMetricMetricKey(definition.metric_key || "")] ?? 0;
    let eligible = threshold ? metricValue >= threshold : false;
    let periodStart: string | null = null;
    let periodEnd: string | null = null;
    const metadata: Record<string, unknown> = { metric_value: metricValue };

    if (definition.badge_key === "monthly_hustler") {
      eligible = monthScore >= threshold;
      periodStart = currentMonthStart;
      periodEnd = currentMonthEnd;
    }

    if (definition.badge_key === "top_performer_week" || definition.badge_key === "top_performer_month") {
      eligible = !!teamRank && teamRank === 1;
      metadata.team_rank = teamRank;
      metadata.organization_id = organizationId || null;
    }

    if (definition.badge_key === "team_goal_crusher") {
      eligible = organizationId ? allTimeScore > 0 : false;
      metadata.organization_id = organizationId || null;
    }

    if (!eligible) continue;

    const badgeKey = `${definition.badge_key}:${periodStart || ""}:${periodEnd || ""}`;
    if (existingKeys.has(badgeKey)) continue;

    achievementEligible.push({
      definition,
      period_start: periodStart,
      period_end: periodEnd,
      metadata
    });
    existingKeys.add(badgeKey);
  }

  if (!achievementEligible.length) {
    return { earned: [], existing: existingBadges };
  }

  const { error } = await admin.from("gamification_user_badges").insert(
    achievementEligible.map(({ definition, period_start, period_end, metadata }) => ({
      user_id: userId,
      badge_key: definition.badge_key,
      earned_at: new Date().toISOString(),
      period_start,
      period_end,
      metadata: {
        ...metadata,
        name: definition.name,
        point_bonus: definition.point_bonus || 0
      }
    }))
  );

  if (error && !isMissingTable(error)) {
    console.error("awardEligibleBadges failed", { userId, error: error.message });
  }

  return {
    earned: achievementEligible.map(({ definition }) => definition.badge_key),
    existing: existingBadges
  };
}

export async function getPersonalGamificationSummary({
  userId,
  profileId,
  month = appMonthKey(),
  admin = createAdminClient()
}: {
  userId: string;
  profileId?: string | null;
  month?: string;
  admin?: ReturnType<typeof createAdminClient>;
}) {
  const { analyticsEvents, contactSubmissions, salesAttributionEvents } = await listPersonalEvents({ userId, profileId, admin });
  const monthScore = await calculateMonthlyScore(userId, month, { profileId, admin });
  const badges = await listUserBadges(userId, admin);
  const badgeDefinitions = await listBadgeDefinitions(admin);
  const score = calculateTapTaggScore(analyticsEvents).total;
  const streak = calculateStreak(analyticsEvents);
  const revenueLogged = salesAttributionEvents.reduce((total, event) => total + Number(event.revenue_amount || 0), 0);

  return {
    contactsCaptured: contactSubmissions.length,
    contactsCapturedThisMonth: contactSubmissions.filter((contact) => (contact.created_at || "").startsWith(`${month}-`)).length,
    taptaggScore: score,
    monthlyScore: monthScore,
    currentStreak: streak,
    profileViews: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "profile_view").length,
    qrScans: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "qr_scan").length,
    vcardDownloads: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "vcard_download").length,
    phoneClicks: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "phone_click").length,
    emailClicks: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "email_click").length,
    websiteClicks: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "website_click").length,
    socialClicks: analyticsEvents.filter((event) => normalizeGamificationEventType(event.event_type) === "social_click").length,
    appointmentActions: calculateMetricValue("appointment_actions", { analyticsEvents }),
    salesLogged: salesAttributionEvents.filter((event) => event.attribution_type === "sale_logged").length,
    revenueLogged,
    badges,
    badgeDefinitions
  };
}

export async function getOrganizationGamificationSummary({
  organizationId,
  month = appMonthKey(),
  admin = createAdminClient()
}: {
  organizationId: string;
  month?: string;
  admin?: ReturnType<typeof createAdminClient>;
}) {
  const leaderboard = await calculateOrganizationLeaderboard(organizationId, month, { admin });
  const [challenges, competitions, sales] = await Promise.all([
    safeSelect<TeamChallenge>(admin.from("gamification_team_challenges").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false })),
    safeSelect<Competition>(admin.from("gamification_competitions").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false })),
    safeSelect<SalesAttributionEvent>(admin.from("sales_attribution_events").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }))
  ]);

  const activeChallenges = challenges.filter((challenge) => challenge.status === "active");
  const challengeProgress: ChallengeProgress[] = await Promise.all(activeChallenges.map(async (challenge) => {
    const progress = await calculateChallengeProgress(challenge, { admin });
    const today = new Date();
    const end = new Date(challenge.end_date);
    const daysRemaining = dayKeysBetween(today, end).length;

    return {
      challenge,
      progress_value: progress.progressValue,
      goal_value: challenge.goal_value,
      percent: progress.percent,
      days_remaining: daysRemaining,
      top_contributors: progress.leaderboard.slice(0, 5)
    };
  }));

  return {
    leaderboard,
    challenges,
    activeChallenges,
    challengeProgress,
    competitions,
    salesAttributionEvents: sales
  };
}
