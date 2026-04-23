import { NextResponse } from "next/server";
import { getProfileBySlugServer } from "@/lib/profile-service-server";
import { PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";

type RouteContext = {
  params: Promise<{ slug: string }>;
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

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const profile = await getProfileBySlugServer(slug);

  if (
    !profile ||
    profile.is_active === false ||
    profile.consent_public_visibility !== true ||
    (profile.slug_status && profile.slug_status !== "approved")
  ) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcf(profile.full_name)}`,
    profile.role_line ? `TITLE:${escapeVcf(profile.role_line)}` : "",
    profile.email ? `EMAIL;TYPE=INTERNET:${escapeVcf(profile.email)}` : "",
    profile.phone ? `TEL;TYPE=CELL:${escapeVcf(cleanPhone(profile.phone))}` : "",
    profile.website_url ? `URL:${escapeVcf(profile.website_url)}` : "",
    profile.intro ? `NOTE:${escapeVcf(profile.intro)}` : "",
    "END:VCARD"
  ]
    .filter(Boolean)
    .join("\n");

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      ...PROFILE_CACHE_HEADERS,
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`
    }
  });
}
