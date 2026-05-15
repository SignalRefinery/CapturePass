import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getProfileByTokenServer } from "@/lib/profile-service-server";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata() {
  return profileMetadata();
}

export default async function PrivateTokenProfilePage({ params }: PageProps) {
  noStore();

  const { token } = await params;
  const profile = await getProfileByTokenServer(token);

  if (
    !profile ||
    profile.is_active === false ||
    profile.consent_public_visibility !== true ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }

  redirect(`/${profile.slug}`);
}
