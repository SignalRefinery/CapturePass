import { NextResponse } from "next/server";
import { getProfileBySlugServer } from "@/lib/profile-service-server";
import { PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { profileCanRenderPublicly } from "@/lib/plans";
import type { ProfileRecord } from "@/lib/types";

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

function safeVcardFilename(slug: string) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${safeSlug || "taptagg-contact"}.vcf`;
}

function profileToVcardContact(profile: ProfileRecord) {
  return {
    full_name: profile.full_name,
    organization_name: profile.organization_name,
    role_line: profile.role_line,
    intro: profile.intro,
    email: profile.email,
    phone: profile.phone,
    website_url: profile.website_url,
    show_email: true,
    show_phone: true
  };
}

function getProfileUrl(request: Request, slug: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const origin = configuredOrigin || new URL(request.url).origin;
  return new URL(`/${slug}`, origin).toString();
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const profile = (await getProfileBySlugServer(slug)) as ProfileRecord | null;

  if (
    !profile ||
    !profileCanRenderPublicly(profile) ||
    profile.consent_public_visibility !== true ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const contact = profileToVcardContact(profile);
  const publicProfileUrl = getProfileUrl(request, slug);
  const websiteUrl = contact.website_url || "";
  const profileUrlLine = websiteUrl === publicProfileUrl ? "" : `URL:${escapeVcf(publicProfileUrl)}`;

  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcf(contact.full_name)}`,
    contact.organization_name ? `ORG:${escapeVcf(contact.organization_name)}` : "",
    contact.role_line ? `TITLE:${escapeVcf(contact.role_line)}` : "",
    contact.show_email && contact.email ? `EMAIL;TYPE=INTERNET:${escapeVcf(contact.email)}` : "",
    contact.show_phone && contact.phone ? `TEL;TYPE=CELL:${escapeVcf(cleanPhone(contact.phone))}` : "",
    websiteUrl ? `URL:${escapeVcf(websiteUrl)}` : "",
    profileUrlLine,
    contact.intro ? `NOTE:${escapeVcf(contact.intro)}` : "",
    "END:VCARD"
  ]
    .filter(Boolean)
    .join("\r\n");
  const filename = safeVcardFilename(slug);

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      ...PROFILE_CACHE_HEADERS,
      // Many mobile browsers and desktop clients rely on these exact headers
      // to treat the response as a contact card instead of a plain text file.
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
