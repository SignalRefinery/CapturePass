import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessTypePrimaryLinkDefaults } from "@/lib/business-types";
import { isCapturePassBootstrapAdminEmail } from "@/lib/auth/admin-shared";
import { slugify } from "@/lib/utils";
import { getSiteOrigin } from "@/lib/site-url";
import { buildPassVcardUrl } from "@/lib/vcard";
import type { OrganizationMemberRecord, OrganizationRecord, PassTokenRecord, ProfileRecord } from "@/lib/types";

type PublicBusinessProfile = ProfileRecord & {
  public_url?: string | null;
  vcard_url?: string | null;
  business_home_url?: string | null;
  is_business_profile?: boolean | null;
  contact_share_profile_id?: string | null;
  contact_share_organization_id?: string | null;
  analytics_organization_id?: string | null;
  analytics_organization_member_id?: string | null;
  analytics_card_id?: string | null;
  business_links?: Array<{ title: string; url: string }> | null;
  profile_image_url?: string | null;
  brand_theme?: OrganizationRecord["brand_theme"] | null;
  show_email?: boolean | null;
  show_phone?: boolean | null;
};

type BusinessPublicResolution =
  | { kind: "not_found" }
  | { kind: "redirect"; redirectTo: string }
  | { kind: "render"; profile: PublicBusinessProfile };

type ResolvePublicBusinessProfileArgs = {
  businessSlug: string;
  memberSlug?: string | null;
};

function normalizeRouteSlug(value?: string | null) {
  return slugify(value || "");
}

function buildBusinessLinks(organization: OrganizationRecord) {
  return [
    { title: organization.business_link_1_title, url: organization.business_link_1_url },
    { title: organization.business_link_2_title, url: organization.business_link_2_url },
    { title: organization.business_link_3_title, url: organization.business_link_3_url },
    { title: organization.business_link_4_title, url: organization.business_link_4_url }
  ]
    .map((item) => ({
      title: (item.title || "").trim(),
      url: (item.url || "").trim()
    }))
    .filter((item) => item.title && item.url);
}

function pickMainMember(members: OrganizationMemberRecord[]) {
  const activeMembers = members.filter((member) => member.status === "active" && !isCapturePassBootstrapAdminEmail(member.email));
  const privilegedMember = activeMembers.find((member) =>
    ["owner", "admin", "super_admin", "business_admin"].includes(String(member.role || ""))
  );

  return privilegedMember || activeMembers[0] || null;
}

function findMemberBySlug(members: OrganizationMemberRecord[], memberSlug: string) {
  const normalizedMemberSlug = normalizeRouteSlug(memberSlug);
  if (!normalizedMemberSlug) return null;

  const exactMatch = members.find((member) => normalizeRouteSlug(member.name) === normalizedMemberSlug) || null;
  if (exactMatch) return exactMatch;

  return (
    members.find((member) => normalizeRouteSlug((member.name || "").split(/\s+/)[0]) === normalizedMemberSlug) ||
    null
  );
}

async function getMemberProfileName(admin: ReturnType<typeof createAdminClient>, member: OrganizationMemberRecord) {
  if (!member.user_id) {
    return member.name.trim();
  }

  const { data } = await admin
    .from("profiles")
    .select("full_name")
    .eq("user_id", member.user_id)
    .maybeSingle();

  return (data?.full_name || member.name || "").trim();
}

async function getAssignedActiveToken(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  memberId: string
) {
  const { data: tokens } = await admin
    .from("pass_tokens")
    .select("id, token, status, token_type, organization_id, assigned_member_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const activeTokens = (tokens || []) as PassTokenRecord[];
  return activeTokens.find((token) => token.assigned_member_id === memberId) || null;
}

function buildBusinessProfile({
  organization,
  member,
  token,
  publicSlug
}: {
  organization: OrganizationRecord;
  member: OrganizationMemberRecord;
  token: PassTokenRecord;
  publicSlug: string;
}): PublicBusinessProfile {
  const siteOrigin = getSiteOrigin();
  const publicUrl = `${siteOrigin}/${publicSlug}`;
  const homeUrl = `${siteOrigin}/${organization.slug || ""}`.replace(/\/$/, "");
  const businessTypeDefaults = getBusinessTypePrimaryLinkDefaults(organization.business_type) || {
    primary_link_1_title: member.phone ? "Call" : "",
    primary_link_1_url: member.phone ? `tel:${member.phone.replace(/\D/g, "")}` : "",
    primary_link_1_type: member.phone ? "phone" : "website",
    primary_link_2_title: member.email ? "Email" : "",
    primary_link_2_url: member.email ? `mailto:${member.email}` : "",
    primary_link_2_type: member.email ? "email" : "website",
    primary_link_3_title: "",
    primary_link_3_url: "",
    primary_link_3_type: "website",
    primary_link_4_title: "",
    primary_link_4_url: "",
    primary_link_4_type: "website"
  };

  return {
    slug: publicSlug,
    public_url: publicUrl,
    vcard_url: buildPassVcardUrl(token.token),
    business_home_url: homeUrl,
    is_business_profile: true,
    contact_share_profile_id: member.id,
    contact_share_organization_id: organization.id,
    analytics_organization_id: organization.id,
    analytics_organization_member_id: member.id,
    analytics_card_id: token.id,
    business_links: buildBusinessLinks(organization),
    full_name: member.name,
    organization_name: organization.name || "",
    profile_image_url: member.headshot_url || null,
    brand_logo_url: organization.brand_logo_url || null,
    business_type: organization.business_type || null,
    brand_color_primary: organization.brand_color_primary || organization.brand_color || null,
    brand_color_secondary: organization.brand_color_secondary || null,
    brand_color_accent: organization.brand_color_accent || null,
    brand_color_background: organization.brand_color_background || null,
    brand_color_text: organization.brand_color_text || null,
    theme_key: organization.theme_key || null,
    brand_theme: organization.brand_theme || "full_color",
    role_line: member.title || "",
    intro: `Connect with ${member.name}${organization.name ? ` at ${organization.name}` : ""}.`,
    email: member.email || "",
    phone: member.phone || "",
    text_phone: member.phone || "",
    website_url: "",
    show_email: !!member.email,
    show_phone: !!member.phone,
    show_text: !!member.phone,
    ...businessTypeDefaults
  };
}

export async function resolvePublicBusinessProfile({
  businessSlug,
  memberSlug = null
}: ResolvePublicBusinessProfileArgs): Promise<BusinessPublicResolution> {
  const normalizedBusinessSlug = normalizeRouteSlug(businessSlug);
  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select(`
      id,
      slug,
      name,
      brand_color,
      brand_color_primary,
      brand_color_secondary,
      brand_color_accent,
      brand_color_background,
      brand_color_text,
      theme_key,
      brand_theme,
      brand_logo_url,
      business_type,
      business_link_1_title,
      business_link_1_url,
      business_link_2_title,
      business_link_2_url,
      business_link_3_title,
      business_link_3_url,
      business_link_4_title,
      business_link_4_url
    `)
    .eq("slug", normalizedBusinessSlug)
    .maybeSingle();

  if (!organization?.slug) {
    return { kind: "not_found" };
  }

  const { data: members } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, name, email, phone, title, role, status, headshot_url")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  const organizationMembers = (members || []) as OrganizationMemberRecord[];
  const requestedMember = memberSlug ? findMemberBySlug(organizationMembers, memberSlug) : null;
  const mainMember = pickMainMember(organizationMembers);

  if (memberSlug && !requestedMember) {
    return { kind: "not_found" };
  }

  if (requestedMember && requestedMember.status !== "active") {
    return { kind: "redirect", redirectTo: `/${organization.slug}` };
  }

  const selectedMember = requestedMember || mainMember;
  if (!selectedMember) {
    return { kind: "not_found" };
  }

  const selectedToken = await getAssignedActiveToken(admin, organization.id, selectedMember.id);
  if (!selectedToken) {
    return memberSlug
      ? { kind: "redirect", redirectTo: `/${organization.slug}` }
      : { kind: "not_found" };
  }

  const profileName = await getMemberProfileName(admin, selectedMember);
  const businessProfile = buildBusinessProfile({
    organization: organization as OrganizationRecord,
    member: {
      ...selectedMember,
      name: profileName || selectedMember.name
    },
    token: selectedToken,
    publicSlug: memberSlug ? `${organization.slug}/${normalizeRouteSlug(memberSlug)}` : organization.slug
  });

  return { kind: "render", profile: businessProfile };
}
