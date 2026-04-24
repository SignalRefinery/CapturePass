import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getProfileByTokenServer } from "@/lib/profile-service-server";
import { profileMetadata } from "@/lib/privacy/profile-privacy";

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
    (profile.slug_status && profile.slug_status !== "approved") ||
    !profile.slug
  ) {
    notFound();
  }

  redirect(`/${profile.slug}`);
}