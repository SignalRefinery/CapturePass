import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DigitalPassCard } from "@/components/dashboard/digital-pass-card";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { profileCanRenderPublicly } from "@/lib/plans";
import { getPreferredProfileShareUrl } from "@/lib/urls/profile-url";
import type { ProfileRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ view?: string }>;
};

export async function generateMetadata() {
  return profileMetadata();
}

export default async function PublicDigitalPassPage({ params, searchParams }: PageProps) {
  noStore();

  const { token } = await params;
  const requestedView = (await searchParams)?.view || null;
  if (requestedView) {
    redirect(`/pass/${token}`);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("private_token", token)
    .maybeSingle<ProfileRecord>();

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
      label: "TapTagg profile",
      url: getPreferredProfileShareUrl(profile),
      passUrl: `/pass/${token}`
    }
  ];

  return (
    <main className="public-pass-page">
      <DigitalPassCard
        name={profile.full_name || "TapTagg"}
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
