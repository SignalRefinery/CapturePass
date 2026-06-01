import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsEventRecord, ContactSubmissionRecord, SalesAttributionEvent, TeamChallenge, Competition } from "@/lib/types";
import {
  appMonthKey,
  awardEligibleBadges,
  calculateChallengeProgress,
  calculateOrganizationLeaderboardForRange,
  leaderboardMetricValue,
  monthBounds,
  previousMonthKey
} from "@/lib/gamification/server";

export const dynamic = "force-dynamic";

type UserTarget = {
  userId: string;
  profileIds: Set<string>;
  organizationIds: Set<string>;
};

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function requireCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  return !!secret && authorization === `Bearer ${secret}`;
}

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function utcDateStart(value: string) {
  return `${value}T00:00:00.000Z`;
}

function utcDateEnd(value: string) {
  return `${value}T23:59:59.999Z`;
}

function addTarget(targets: Map<string, UserTarget>, userId?: string | null, profileId?: string | null, organizationId?: string | null) {
  if (!userId) return;
  const target = targets.get(userId) || {
    userId,
    profileIds: new Set<string>(),
    organizationIds: new Set<string>()
  };

  if (profileId) target.profileIds.add(profileId);
  if (organizationId) target.organizationIds.add(organizationId);
  targets.set(userId, target);
}

async function selectRows<T>(query: unknown) {
  const result = await query as { data: T[] | null; error: { message?: string; code?: string } | null };
  if (result.error?.code === "42P01") return [];
  if (result.error) {
    console.error("Gamification cron query failed", { error: result.error.message });
    return [];
  }
  return result.data || [];
}

async function collectActivityTargets({
  admin,
  start,
  end
}: {
  admin: ReturnType<typeof createAdminClient>;
  start: string;
  end: string;
}) {
  const [analyticsEvents, contacts, salesEvents] = await Promise.all([
    selectRows<Pick<AnalyticsEventRecord, "user_id" | "profile_id" | "organization_id" | "organization_member_id">>(
      admin
        .from("analytics_events")
        .select("user_id, profile_id, organization_id, organization_member_id")
        .gte("created_at", start)
        .lte("created_at", end)
    ),
    selectRows<Pick<ContactSubmissionRecord, "submitted_to_user_id" | "profile_id" | "organization_id">>(
      admin
        .from("contact_submissions")
        .select("submitted_to_user_id, profile_id, organization_id")
        .gte("created_at", start)
        .lte("created_at", end)
    ),
    selectRows<Pick<SalesAttributionEvent, "owner_user_id" | "organization_id" | "profile_id">>(
      admin
        .from("sales_attribution_events")
        .select("owner_user_id, organization_id, profile_id")
        .gte("occurred_at", start)
        .lte("occurred_at", end)
    )
  ]);

  const targets = new Map<string, UserTarget>();
  const profileIds = new Set<string>();
  const organizationMemberIds = new Set<string>();

  analyticsEvents.forEach((event) => {
    addTarget(targets, event.user_id, event.profile_id, event.organization_id);
    if (event.profile_id) profileIds.add(event.profile_id);
    if (event.organization_member_id) organizationMemberIds.add(event.organization_member_id);
  });

  contacts.forEach((contact) => {
    addTarget(targets, contact.submitted_to_user_id, contact.profile_id, contact.organization_id);
    if (contact.profile_id) {
      if (contact.organization_id) organizationMemberIds.add(contact.profile_id);
      else profileIds.add(contact.profile_id);
    }
  });

  salesEvents.forEach((event) => {
    addTarget(targets, event.owner_user_id, event.profile_id, event.organization_id);
    if (event.profile_id) profileIds.add(event.profile_id);
  });

  const [profiles, members] = await Promise.all([
    profileIds.size
      ? selectRows<{ id: string; user_id: string | null }>(
          admin.from("profiles").select("id, user_id").in("id", [...profileIds])
        )
      : Promise.resolve([]),
    organizationMemberIds.size
      ? selectRows<{ id: string; user_id: string | null; organization_id: string }>(
          admin.from("organization_members").select("id, user_id, organization_id").in("id", [...organizationMemberIds])
        )
      : Promise.resolve([])
  ]);

  profiles.forEach((profile) => addTarget(targets, profile.user_id, profile.id, null));
  members.forEach((member) => addTarget(targets, member.user_id, null, member.organization_id));

  if (targets.size) {
    const userProfiles = await selectRows<{ id: string; user_id: string | null }>(
      admin.from("profiles").select("id, user_id").in("user_id", [...targets.keys()])
    );
    userProfiles.forEach((profile) => addTarget(targets, profile.user_id, profile.id, null));
  }

  return [...targets.values()];
}

async function snapshotActiveChallenges(admin: ReturnType<typeof createAdminClient>, today: string) {
  const activeChallenges = await selectRows<TeamChallenge>(
    admin.from("gamification_team_challenges").select("*").eq("status", "active")
  );
  let snapshotsUpdated = 0;
  let challengesClosed = 0;

  for (const challenge of activeChallenges) {
    const progress = await calculateChallengeProgress(challenge, { admin });
    const metadata = {
      percent: progress.percent,
      top_contributors: progress.leaderboard.slice(0, 5).map((row) => ({
        user_id: row.user_id,
        organization_member_id: row.organization_member_id,
        name: row.name,
        score: leaderboardMetricValue(row, challenge.metric_key)
      }))
    };

    const { error: upsertError } = await admin
      .from("gamification_challenge_progress_snapshots")
      .upsert({
        challenge_id: challenge.id,
        organization_id: challenge.organization_id,
        progress_value: progress.progressValue,
        goal_value: challenge.goal_value,
        snapshot_date: today,
        metadata
      }, { onConflict: "challenge_id,snapshot_date" });

    if (!upsertError) snapshotsUpdated += 1;
    if (upsertError && upsertError.code !== "42P01") {
      console.error("Gamification challenge snapshot failed", { challengeId: challenge.id, error: upsertError.message });
    }

    if (challenge.end_date < today) {
      const status = progress.progressValue >= challenge.goal_value ? "completed" : "expired";
      const { error } = await admin
        .from("gamification_team_challenges")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", challenge.id)
        .eq("status", "active");

      if (!error) challengesClosed += 1;
      if (error) console.error("Gamification challenge close failed", { challengeId: challenge.id, error: error.message });
    }
  }

  return { snapshotsUpdated, challengesClosed };
}

async function closeExpiredCompetitions(admin: ReturnType<typeof createAdminClient>, today: string) {
  const expiredCompetitions = await selectRows<Competition>(
    admin
      .from("gamification_competitions")
      .select("*")
      .eq("status", "active")
      .lt("end_date", today)
  );
  let competitionsClosed = 0;
  let competitionResultsStored = 0;

  for (const competition of expiredCompetitions) {
    const leaderboard = await calculateOrganizationLeaderboardForRange(
      competition.organization_id,
      utcDateStart(competition.start_date),
      utcDateEnd(competition.end_date),
      { admin }
    );
    const rankedRows = leaderboard
      .filter((row) => row.user_id && row.user_id !== row.organization_member_id)
      .map((row) => ({ row, score: leaderboardMetricValue(row, competition.metric_key) }))
      .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const { error: deleteError } = await admin
      .from("gamification_competition_results")
      .delete()
      .eq("competition_id", competition.id);

    if (deleteError && deleteError.code !== "42P01") {
      console.error("Gamification competition result cleanup failed", { competitionId: competition.id, error: deleteError.message });
    }

    if (rankedRows.length) {
      const { error: insertError } = await admin.from("gamification_competition_results").insert(
        rankedRows.map(({ row, score, rank }) => ({
          competition_id: competition.id,
          user_id: row.user_id,
          rank,
          score_value: score,
          calculated_at: new Date().toISOString(),
          metadata: {
            organization_member_id: row.organization_member_id,
            name: row.name,
            metric_key: competition.metric_key
          }
        }))
      );

      if (!insertError) competitionResultsStored += rankedRows.length;
      if (insertError && insertError.code !== "42P01") {
        console.error("Gamification competition result insert failed", { competitionId: competition.id, error: insertError.message });
      }
    }

    const { error: updateError } = await admin
      .from("gamification_competitions")
      .update({ status: "completed" })
      .eq("id", competition.id)
      .eq("status", "active");

    if (!updateError) competitionsClosed += 1;
    if (updateError) console.error("Gamification competition close failed", { competitionId: competition.id, error: updateError.message });
  }

  return { competitionsClosed, competitionResultsStored };
}

export async function POST(request: Request) {
  if (!requireCronSecret(request)) return unauthorized();

  const admin = createAdminClient();
  const now = new Date();
  const today = utcDateKey(now);
  const months = [previousMonthKey(now), appMonthKey(now)];
  const currentBounds = monthBounds(months[1]);
  const previousBounds = monthBounds(months[0]);
  const startedAt = Date.now();
  let badgeUsersConsidered = 0;
  let badgesAwarded = 0;

  const targets = await collectActivityTargets({
    admin,
    start: previousBounds.start,
    end: currentBounds.end
  });

  for (const target of targets) {
    badgeUsersConsidered += 1;
    const profileId = [...target.profileIds][0] || null;
    const organizationId = [...target.organizationIds][0] || null;

    for (const month of months) {
      const result = await awardEligibleBadges({
        userId: target.userId,
        profileId,
        organizationId,
        month,
        admin
      });
      badgesAwarded += result.earned.length;
    }
  }

  const challengeSummary = await snapshotActiveChallenges(admin, today);
  const competitionSummary = await closeExpiredCompetitions(admin, today);
  const summary = {
    ok: true,
    months,
    badgeUsersConsidered,
    badgesAwarded,
    ...challengeSummary,
    ...competitionSummary,
    durationMs: Date.now() - startedAt
  };

  console.info("Gamification reconciliation complete", summary);
  return NextResponse.json(summary);
}
