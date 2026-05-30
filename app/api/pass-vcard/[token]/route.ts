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
    .select("token, status, organization_id, assigned_member_id")
    .eq("token", token)
    .maybeSingle();

  if (!passToken || passToken.status !== "active" || !passToken.assigned_member_id) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const [{ data: member }, { data: organization }] = await Promise.all([
    admin
      .from("organization_members")
      .select("name, email, phone, title, status")
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

  if (!member || member.status !== "active" || !member.name) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const publicPassUrl = getPassUrl(request, token);
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcf(member.name)}`,
    organization?.name ? `ORG:${escapeVcf(organization.name)}` : "",
    member.title ? `TITLE:${escapeVcf(member.title)}` : "",
    member.email ? `EMAIL;TYPE=INTERNET:${escapeVcf(member.email)}` : "",
    member.phone ? `TEL;TYPE=CELL:${escapeVcf(cleanPhone(member.phone))}` : "",
    `URL:${escapeVcf(publicPassUrl)}`,
    "END:VCARD"
  ]
    .filter(Boolean)
    .join("\r\n");
  const filename = safeVcardFilename(member.name);

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
