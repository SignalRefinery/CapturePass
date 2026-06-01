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

function cleanAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : null;
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

async function canAccessOrganization(admin: ReturnType<typeof createAdminClient>, organizationId: string, userId: string) {
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

  return !!member;
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const admin = createAdminClient();

  if (organizationId && !(await canAccessOrganization(admin, organizationId, user.id))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const query = admin.from("sales_attribution_events").select("*").order("created_at", { ascending: false });
  const { data: events, error } = organizationId
    ? await query.eq("organization_id", organizationId)
    : await query.eq("owner_user_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, events: events || [] });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const payload = await readPayload(request);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const attributionType = cleanText((payload as { attribution_type?: unknown }).attribution_type, 60);
  const validTypes = new Set([
    "appointment_booked",
    "follow_up_logged",
    "opportunity_created",
    "sale_logged",
    "revenue_logged"
  ]);

  if (!validTypes.has(attributionType)) {
    return NextResponse.json({ ok: false, error: "Invalid attribution type." }, { status: 400 });
  }

  const admin = createAdminClient();
  if ((payload as { organization_id?: unknown }).organization_id) {
    const orgId = cleanText((payload as { organization_id?: unknown }).organization_id, 64);
    if (!orgId || !(await canAccessOrganization(admin, orgId, user.id))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }
  const { data, error } = await admin
    .from("sales_attribution_events")
    .insert({
      organization_id: cleanText((payload as { organization_id?: unknown }).organization_id, 64) || null,
      profile_id: cleanText((payload as { profile_id?: unknown }).profile_id, 64) || null,
      owner_user_id: user.id,
      contact_submission_id: cleanText((payload as { contact_submission_id?: unknown }).contact_submission_id, 64) || null,
      attribution_type: attributionType,
      revenue_amount: cleanAmount((payload as { revenue_amount?: unknown }).revenue_amount),
      deal_name: cleanText((payload as { deal_name?: unknown }).deal_name, 140) || null,
      customer_name: cleanText((payload as { customer_name?: unknown }).customer_name, 140) || null,
      notes: cleanText((payload as { notes?: unknown }).notes, 600) || null,
      source: cleanText((payload as { source?: unknown }).source, 40) || "manual"
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: data });
}
