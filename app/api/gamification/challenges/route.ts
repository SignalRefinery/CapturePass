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

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json().catch(() => null);
  }
  const formData = await request.formData().catch(() => null);
  if (!formData) return null;
  return Object.fromEntries(formData.entries());
}

async function requireOrgAdmin(admin: ReturnType<typeof createAdminClient>, organizationId: string, userId: string) {
  const { data: organization } = await admin
    .from("organizations")
    .select("owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organization?.owner_user_id === userId) return true;

  const { data: member } = await admin
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return !!member && ["owner", "admin", "super_admin", "business_admin"].includes(String(member.role || ""));
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!(await requireOrgAdmin(admin, organizationId, user.id))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("gamification_team_challenges")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, challenges: data || [] });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const payload = await readPayload(request);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const organizationId = cleanText((payload as { organization_id?: unknown }).organization_id, 64);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organization_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!(await requireOrgAdmin(admin, organizationId, user.id))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("gamification_team_challenges")
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      title: cleanText((payload as { title?: unknown }).title, 120),
      description: cleanText((payload as { description?: unknown }).description, 600) || null,
      metric_key: cleanText((payload as { metric_key?: unknown }).metric_key, 80),
      goal_value: Number((payload as { goal_value?: unknown }).goal_value || 0),
      start_date: cleanText((payload as { start_date?: unknown }).start_date, 20),
      end_date: cleanText((payload as { end_date?: unknown }).end_date, 20),
      prize: cleanText((payload as { prize?: unknown }).prize, 180) || null,
      status: cleanText((payload as { status?: unknown }).status, 20) || "active"
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, challenge: data });
}
