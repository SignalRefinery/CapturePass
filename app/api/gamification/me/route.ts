import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPersonalGamificationSummary, awardEligibleBadges } from "@/lib/gamification/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const profileId = url.searchParams.get("profileId");
  const month = url.searchParams.get("month") || undefined;
  const admin = createAdminClient();

  const summary = await getPersonalGamificationSummary({
    userId: user.id,
    profileId,
    month,
    admin
  });

  await awardEligibleBadges({
    userId: user.id,
    profileId,
    month,
    admin
  });

  return NextResponse.json({ ok: true, summary });
}
