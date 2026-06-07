import {
  getPublicProfileBySlug,
  getPublicProfileByToken
} from "@/lib/profiles/public-profile-source";

export async function resolveProfileByTokenOrSlug({
  token,
  slug
}: {
  token?: string | null;
  slug?: string | null;
}) {
  if (token) {
    return getPublicProfileByToken(token);
  }

  if (slug) {
    return getPublicProfileBySlug(slug);
  }

  return null;
}
