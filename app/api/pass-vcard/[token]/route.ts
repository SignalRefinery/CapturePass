import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function cleanPhone(value?: string | null) {
  if (!value) return "";
  return value.replace(/[^0-9+]/g, "");
}

function escapeVcf(value?: string | null) {
  return (value || "")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function safeVcardFilename(name?: string | null) {
  const safeName = (name || "taptagg-contact")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safeName || "taptagg-contact"}.vcf`;
}

function cleanValue(value?: string | null) {
  const trimmed = (value || "").trim();
  return trimmed.length ? trimmed : null;
}

async function getAuthFullName(userId?: string | null) {
  if (!userId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    return null;
  }

  const meta = data.user.user_metadata || {};
  return (
    cleanValue(typeof meta.full_name === "string" ? meta.full_name : null) ||
    cleanValue(
      `${typeof meta.first_name === "string" ? meta.first_name : ""} ${
        typeof meta.last_name === "string" ? meta.last_name : ""
      }`
    )
  );
}

function getPassUrl(request: Request, token: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const origin = configuredOrigin || new URL(request.url).origin;
  return new URL(`/p/${token}`, origin).toString();
}

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const admin = createAdminClient();
  const { data: passToken } = await admin
    .from("pass_tokens")
    .select("id, token, status, organization_id, assigned_member_id")
    .eq("token", token)
    .maybeSingle();

  if (!passToken || passToken.status !== "active" || !passToken.assigned_member_id) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const [{ data: member }, { data: organization }] = await Promise.all([
    admin
      .from("organization_members")
      .select("id, user_id, name, email, phone, title, status")
      .eq("id", passToken.assigned_member_id)
      .maybeSingle(),
    passToken.organization_id
      ? admin
          .from("organizations")
          .select("name")
          .eq("id", passToken.organization_id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const { data: memberProfile } = member?.user_id
    ? await admin
        .from("profiles")
        .select("full_name")
        .eq("user_id", member.user_id)
        .maybeSingle()
    : { data: null };
  const authFullName = await getAuthFullName(member?.user_id || null);
  const memberName = authFullName || memberProfile?.full_name?.trim() || member?.name || "";

  if (!member || member.status !== "active" || !memberName) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const publicPassUrl = getPassUrl(request, token);
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcf(memberName)}`,
    `N:${escapeVcf(memberName)}`,
    organization?.name ? `ORG:${escapeVcf(organization.name)}` : "",
    member.title ? `TITLE:${escapeVcf(member.title)}` : "",
    member.email ? `EMAIL;TYPE=INTERNET:${escapeVcf(member.email)}` : "",
    member.phone ? `TEL;TYPE=CELL:${escapeVcf(cleanPhone(member.phone))}` : "",
    `URL:${escapeVcf(publicPassUrl)}`,
    "END:VCARD"
  ]
    .filter(Boolean)
    .join("\r\n");
  const filename = safeVcardFilename(memberName);

  admin.from("analytics_events").insert({
    event_type: "vcard_download",
    organization_id: passToken.organization_id,
    organization_member_id: passToken.assigned_member_id,
    card_id: passToken.id,
    source: "unknown",
    action_type: "custom_button",
    action_label: "Add to Contacts",
    action_url: `/api/pass-vcard/${token}`,
    user_agent: request.headers.get("user-agent") || null,
    referrer: request.headers.get("referer") || null,
    metadata: {}
  }).then(({ error }) => {
    if (error) console.error("Business vCard analytics insert failed", { token, error: error.message });
  });

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      ...PROFILE_CACHE_HEADERS,
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
