type ProfileUrlLike = {
  slug?: string | null;
  private_token?: string | null;
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