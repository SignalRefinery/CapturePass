import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DigitalPassCard } from "@/components/dashboard/digital-pass-card";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { getProfileByTokenServer } from "@/lib/profile-service-server";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { profileCanRenderPublicly } from "@/lib/plans";
import { getPreferredProfileShareUrl } from "@/lib/urls/profile-url";
import type { ProfileRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ view?: string }>;
};

export async function generateMetadata() {
  return profileMetadata({ visibility: "private" });
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://capturepass.com").replace(/\/$/, "");
}

export default async function PublicDigitalPassPage({ params, searchParams }: PageProps) {
  noStore();

  const { token } = await params;
  const requestedView = (await searchParams)?.view || null;
  if (requestedView) {
    redirect(`/pass/${token}`);
  }

  const profile = (await getProfileByTokenServer(token)) as ProfileRecord | null;

  if (
    !profile ||
    !profileCanRenderPublicly(profile) ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }
  const passViews = [
    {
      id: "main",
      label: "Profile",
      url: profile.consent_public_visibility === false ? `${appUrl()}/u/${token}` : getPreferredProfileShareUrl(profile),
      passUrl: `/pass/${token}`
    }
  ];

  return (
    <main className="public-pass-page">
      <DigitalPassCard
        name={profile.full_name || "CapturePass"}
        roleLine={profile.role_line || ""}
        organizationName={profile.organization_name}
        defaultViewId="main"
        selectedViewId="main"
        views={passViews}
        showViewSwitcher={false}
      />
    </main>
  );
}
