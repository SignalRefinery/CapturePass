import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: unknown, max = 180) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

async function requireOrgAdmin(admin: ReturnType<typeof createAdminClient>, challengeId: string, userId: string) {
  const { data: challenge } = await admin
    .from("gamification_team_challenges")
    .select("organization_id")
    .eq("id", challengeId)
    .maybeSingle();

  if (!challenge?.organization_id) return false;

  const { data: organization } = await admin
    .from("organizations")
    .select("owner_user_id")
    .eq("id", challenge.organization_id)
    .maybeSingle();

  if (organization?.owner_user_id === userId) return true;

  const { data: member } = await admin
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", challenge.organization_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return !!member && (member.role === "owner" || member.role === "admin");
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!(await requireOrgAdmin(admin, id, user.id))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("gamification_team_challenges")
    .update({
      title: cleanText((payload as { title?: unknown }).title, 120),
      description: cleanText((payload as { description?: unknown }).description, 600) || null,
      metric_key: cleanText((payload as { metric_key?: unknown }).metric_key, 80),
      goal_value: Number((payload as { goal_value?: unknown }).goal_value || 0),
      start_date: cleanText((payload as { start_date?: unknown }).start_date, 20),
      end_date: cleanText((payload as { end_date?: unknown }).end_date, 20),
      prize: cleanText((payload as { prize?: unknown }).prize, 180) || null,
      status: cleanText((payload as { status?: unknown }).status, 20) || "active"
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, challenge: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const admin = createAdminClient();
  if (!(await requireOrgAdmin(admin, id, user.id))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("gamification_team_challenges").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
