type ProfileUrlLike = {
  slug?: string | null;
  private_token?: string | null;
  consent_public_visibility?: boolean | null;
};

function normalizedAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://signalpass.app").replace(/\/$/, "");
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
  if (!view || view === "profile") {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}view=${encodeURIComponent(view)}`;
}

export function getPreferredProfileShareUrl(profile: ProfileUrlLike, view?: string | null) {
  const baseUrl =
    profile.consent_public_visibility === false && profile.private_token
      ? getIssuedProfileUrl(profile)
      : getReadableProfileUrl(profile);

  return appendProfileViewParam(baseUrl, view);
}
