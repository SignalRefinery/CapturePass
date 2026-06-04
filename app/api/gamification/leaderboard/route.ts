import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateOrganizationLeaderboard } from "@/lib/gamification/server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

function isActiveAdmin(orgMember: { role?: string | null; status?: string | null } | null) {
  return (
    !!orgMember &&
    orgMember.status === "active" &&
    ["owner", "admin", "super_admin", "business_admin"].includes(String(orgMember.role || ""))
  );
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const month = url.searchParams.get("month") || undefined;

  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  const { data: orgMember } = await admin
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (organization?.owner_user_id !== user.id && !isActiveAdmin(orgMember || null)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const leaderboard = await calculateOrganizationLeaderboard(organizationId, month, { admin });
  return NextResponse.json({ ok: true, leaderboard });
}
