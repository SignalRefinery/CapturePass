import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  calculateOrganizationLeaderboardForRange,
  leaderboardMetricValue
} from "@/lib/gamification/server";

function utcDateStart(value: string) {
  return `${value}T00:00:00.000Z`;
}

function utcDateEnd(value: string) {
  return `${value}T23:59:59.999Z`;
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

async function requireOrgAdmin(admin: ReturnType<typeof createAdminClient>, competitionId: string, userId: string) {
  const { data: competition } = await admin
    .from("gamification_competitions")
    .select("*")
    .eq("id", competitionId)
    .maybeSingle();

  if (!competition?.organization_id) return null;

  const { data: organization } = await admin
    .from("organizations")
    .select("owner_user_id")
    .eq("id", competition.organization_id)
    .maybeSingle();

  if (organization?.owner_user_id === userId) return competition;

  const { data: member } = await admin
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", competition.organization_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return !!member && ["owner", "admin", "super_admin", "business_admin"].includes(String(member.role || "")) ? competition : null;
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const admin = createAdminClient();
  const competition = await requireOrgAdmin(admin, id, user.id);

  if (!competition) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (competition.status !== "completed" && competition.status !== "expired") {
    return NextResponse.json(
      { ok: false, error: "Only finalized competitions can be explicitly recalculated." },
      { status: 409 }
    );
  }

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

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
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
          explicit_recalculation: true,
          recalculated_by: user.id,
          organization_member_id: row.organization_member_id,
          name: row.name,
          metric_key: competition.metric_key
        }
      }))
    );

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }
  }

  console.info("Competition results explicitly recalculated", {
    competitionId: competition.id,
    recalculatedBy: user.id,
    resultCount: rankedRows.length
  });

  return NextResponse.json({ ok: true, resultCount: rankedRows.length });
}
