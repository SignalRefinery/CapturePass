import { getSiteOrigin } from "@/lib/site-url";
import { slugify } from "@/lib/utils";

type ProfileUrlLike = {
  slug?: string | null;
  private_token?: string | null;
};

export function getReadableProfileUrl(profile: ProfileUrlLike) {
  const appUrl = getSiteOrigin();
  return `${appUrl}/${profile.slug || ""}`;
}

export function getIssuedProfileUrl(profile: ProfileUrlLike) {
  const appUrl = getSiteOrigin();

  if (!profile.private_token) {
    return `${appUrl}/${profile.slug || ""}`;
  }

  return `${appUrl}/pass/${profile.private_token}`;
}

export function getBusinessMemberProfileUrl(organizationSlug?: string | null, memberName?: string | null) {
  const appUrl = getSiteOrigin();
  const normalizedOrganizationSlug = slugify(organizationSlug || "");
  const normalizedMemberSlug = slugify(memberName || "");

  if (!normalizedOrganizationSlug || !normalizedMemberSlug) {
    return `${appUrl}/${normalizedOrganizationSlug || ""}`;
  }

  return `${appUrl}/${normalizedOrganizationSlug}/${normalizedMemberSlug}`;
}

export function getPreferredProfileShareUrl(profile: ProfileUrlLike) {
  return getReadableProfileUrl(profile);
}
