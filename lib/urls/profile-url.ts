import { getSiteOrigin } from "@/lib/site-url";

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

  return `${appUrl}/u/${profile.private_token}`;
}

export function getPreferredProfileShareUrl(profile: ProfileUrlLike) {
  return getReadableProfileUrl(profile);
}
