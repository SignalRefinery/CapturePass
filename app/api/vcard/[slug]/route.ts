import { NextResponse } from "next/server";
import { queueAnalyticsEvent } from "@/lib/analytics/record-event";
import { getProfileBySlugServer } from "@/lib/profile-service-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { profileCanRenderPublicly } from "@/lib/plans";
import {
  buildVcardFilename,
  buildVcardResponseHeaders,
  buildVcardText
} from "@/lib/vcard";
import type { ProfileRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

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
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const contact = profileToVcardContact(profile);
  const authFullName = await getAuthFullName(profile.user_id || null);
  const displayName = authFullName || contact.full_name;
  const publicProfileUrl = getProfileUrl(request, slug);
  const vcard = buildVcardText({
    fullName: displayName,
    organizationName: contact.organization_name,
    title: contact.role_line,
    email: contact.show_email ? contact.email : null,
    phone: contact.show_phone ? contact.phone : null,
    websiteUrl: contact.website_url,
    profileUrl: publicProfileUrl,
    note: contact.intro
  });
  const filename = buildVcardFilename(slug);

  queueAnalyticsEvent({
    event_type: "vcard_download",
    profile_id: profile.id,
    user_id: profile.user_id,
    source: "unknown",
    action_type: "custom_button",
    action_label: "Add to Contacts",
    action_url: `/api/vcard/${slug}`,
    user_agent: request.headers.get("user-agent") || null,
    referrer: request.headers.get("referer") || null,
    metadata: {}
  }, {
    logLabel: "vCard analytics insert failed",
    logContext: { slug }
  });

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      ...PROFILE_CACHE_HEADERS,
      ...buildVcardResponseHeaders(filename)
    }
  });
}
