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

async function requireOrgAdmin(admin: ReturnType<typeof createAdminClient>, competitionId: string, userId: string) {
  const { data: competition } = await admin
    .from("gamification_competitions")
    .select("organization_id, status")
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

  return !!member && (member.role === "owner" || member.role === "admin") ? competition : null;
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
  const competition = await requireOrgAdmin(admin, id, user.id);
  if (!competition) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (competition.status === "completed" || competition.status === "expired") {
    return NextResponse.json(
      { ok: false, error: "Finalized competition results are immutable. Use explicit recalculation instead." },
      { status: 409 }
    );
  }

  const { data, error } = await admin
    .from("gamification_competitions")
    .update({
      title: cleanText((payload as { title?: unknown }).title, 120),
      metric_key: cleanText((payload as { metric_key?: unknown }).metric_key, 80),
      start_date: cleanText((payload as { start_date?: unknown }).start_date, 20),
      end_date: cleanText((payload as { end_date?: unknown }).end_date, 20),
      prize: cleanText((payload as { prize?: unknown }).prize, 180) || null,
      status: cleanText((payload as { status?: unknown }).status, 20) === "paused" ? "paused" : "active"
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, competition: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const admin = createAdminClient();
  const competition = await requireOrgAdmin(admin, id, user.id);
  if (!competition) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (competition.status === "completed" || competition.status === "expired") {
    return NextResponse.json(
      { ok: false, error: "Finalized competitions cannot be deleted." },
      { status: 409 }
    );
  }

  const { error } = await admin.from("gamification_competitions").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
