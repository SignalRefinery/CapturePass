import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getProfileByTokenServer } from "@/lib/profile-service-server";
import { profileCanRenderPublicly } from "@/lib/plans";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import type { ProfileRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata() {
  return profileMetadata({ visibility: "private" });
}

export default async function PrivateTokenProfilePage({ params }: PageProps) {
  noStore();

  const { token } = await params;
  const profile = (await getProfileByTokenServer(token)) as ProfileRecord | null;

  if (
    !profile ||
    !profileCanRenderPublicly(profile) ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }

  redirect(`/${profile.slug}`);
}
