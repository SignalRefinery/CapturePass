import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPublicProfileViews, profileRecordToPublicProfile } from "@/lib/profiles/public-view";
import { getProfileByTokenServer, PROFILE_VIEW_PUBLIC_SELECT } from "@/lib/profile-service-server";
import { getProfilePlan, profileCanRenderPublicly } from "@/lib/plans";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { TapTaggProfileShell } from "@/components/profile/taptagg-profile-shell";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

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

export default async function PrivateTokenProfilePage({ params, searchParams }: PageProps) {
  noStore();

  const { token } = await params;
  const requestedView = (await searchParams)?.view || null;
  const profile = (await getProfileByTokenServer(token)) as ProfileRecord | null;

  if (
    !profile ||
    !profileCanRenderPublicly(profile) ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }

  if (profile.consent_public_visibility === true) {
    redirect(`/${profile.slug}`);
  }

  const plan = getProfilePlan(profile);
  const isMultiViewProfile = plan.hasMoreProfileSections && profile.page_mode === "multi";
  const admin = createAdminClient();
  const { data: profileViews } = isMultiViewProfile
    ? await admin
        .from("profile_views")
        .select(PROFILE_VIEW_PUBLIC_SELECT)
        .eq("profile_id", profile.id)
        .order("sort_order", { ascending: true })
        .returns<ProfileViewRecord[]>()
    : { data: [] };
  const defaultProfileView =
    isMultiViewProfile
      ? (profile.default_view_id
          ? (profileViews || []).find((view) => view.id === profile.default_view_id)
          : null) ||
        (profileViews || [])[0] ||
        null
      : null;
  const { defaultPublicView, orderedPublicViews } = isMultiViewProfile
    ? buildPublicProfileViews(profile, profileViews || [], defaultProfileView)
    : {
        defaultPublicView: profileRecordToPublicProfile(profile),
        orderedPublicViews: [profileRecordToPublicProfile(profile)]
      };
  const issuedProfileUrl = `${appUrl()}/u/${token}`;
  const issuedDefaultPublicView = { ...defaultPublicView, public_url: issuedProfileUrl };
  const issuedOrderedPublicViews = orderedPublicViews.map((view) => ({
    ...view,
    public_url: issuedProfileUrl
  }));

  // Privacy-mode profiles render only through the issued QR/card URL.
  // The personalized slug remains non-resolving while the issued link works.
  return (
    <TapTaggProfileShell
      profile={issuedDefaultPublicView}
      views={issuedOrderedPublicViews}
      pageMode={profile.page_mode || "single"}
      multiViewDisplayMode={profile.multi_view_display_mode || "favorite"}
      initialView={requestedView}
      heroLabel={defaultPublicView.business_type === "real_estate_brokerage" ? "Live property" : "Live profile"}
    />
  );
}
