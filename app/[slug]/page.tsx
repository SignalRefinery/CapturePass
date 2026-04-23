import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getProfileBySlugServer } from "@/lib/profile-service-server";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { LuxuryProfileShell } from "@/components/profile/luxury-profile-shell";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata() {
  return profileMetadata();
}

export default async function PublicProfilePage({ params }: PageProps) {
  noStore();

  const { slug } = await params;
  const profile = await getProfileBySlugServer(slug);

  if (
    !profile ||
    profile.is_active === false ||
    profile.consent_public_visibility !== true ||
    (profile.slug_status && profile.slug_status !== "approved")
  ) {
    notFound();
  }

  return <LuxuryProfileShell profile={profile} heroLabel="Live profile" />;
}
