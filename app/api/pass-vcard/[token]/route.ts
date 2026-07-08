import { NextResponse } from "next/server";
import { queueAnalyticsEvent } from "@/lib/analytics/record-event";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";
import {
  buildVcardFilename,
  buildVcardResponseHeaders,
  buildVcardText
} from "@/lib/vcard";

type RouteContext = {
  params: Promise<{ token: string }>;
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
      .select("id, user_id, name, email, phone, title, status, location_id")
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
  let locationId: string | null = member?.location_id || null;
  let regionId: string | null = null;

  if (locationId) {
    const { data: location } = await admin
      .from("business_locations")
      .select("id, region_id")
      .eq("id", locationId)
      .maybeSingle();
    locationId = location?.id || null;
    regionId = location?.region_id || null;
  }

  if (!member || member.status !== "active" || !memberName) {
    return new NextResponse("Not found", { status: 404, headers: PROFILE_CACHE_HEADERS });
  }

  const publicPassUrl = getPassUrl(request, token);
  const vcard = buildVcardText({
    fullName: memberName,
    organizationName: organization?.name || "",
    title: member.title || "",
    email: member.email || "",
    phone: member.phone || "",
    profileUrl: publicPassUrl
  });
  const filename = buildVcardFilename(memberName);

  queueAnalyticsEvent({
    event_type: "vcard_download",
    organization_id: passToken.organization_id,
    organization_member_id: passToken.assigned_member_id,
    location_id: locationId,
    region_id: regionId,
    card_id: passToken.id,
    source: "unknown",
    action_type: "custom_button",
    action_label: "Add to Contacts",
    action_url: `/api/pass-vcard/${token}`,
    user_agent: request.headers.get("user-agent") || null,
    referrer: request.headers.get("referer") || null,
    metadata: {}
  }, {
    client: admin,
    logLabel: "Business vCard analytics insert failed",
    logContext: { token }
  });

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      ...PROFILE_CACHE_HEADERS,
      ...buildVcardResponseHeaders(filename)
    }
  });
}
