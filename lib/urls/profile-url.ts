type ProfileUrlLike = {
  slug?: string | null;
  private_token?: string | null;
  consent_public_visibility?: boolean | null;
};

function normalizedAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

export function getReadableProfileUrl(profile: ProfileUrlLike) {
  const appUrl = normalizedAppUrl();
  return `${appUrl}/${profile.slug || ""}`;
}

export function getIssuedProfileUrl(profile: ProfileUrlLike) {
  const appUrl = normalizedAppUrl();

  if (!profile.private_token) {
    return `${appUrl}/${profile.slug || ""}`;
  }

  return `${appUrl}/u/${profile.private_token}`;
}

export function appendProfileViewParam(url: string, view?: string | null) {
  // TapTagg share URLs always target the single public profile. The optional
  // view argument is ignored so dormant multi-view data cannot leak into links.
  void view;
  return url;
}

export function getPreferredProfileShareUrl(profile: ProfileUrlLike, view?: string | null) {
  const baseUrl =
    profile.consent_public_visibility === false && profile.private_token
      ? getIssuedProfileUrl(profile)
      : getReadableProfileUrl(profile);

  return appendProfileViewParam(baseUrl, view);
}
