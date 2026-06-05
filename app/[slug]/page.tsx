import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDefaultProfileViewServer,
  getProfileBySlugServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { buildPublicProfileViews, profileRecordToPublicProfile } from "@/lib/profiles/public-view";
import { getProfilePlan, profileCanRenderPublicly } from "@/lib/plans";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { TapTaggProfileShell } from "@/components/profile/taptagg-profile-shell";
import type { ProfileRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ view?: string }>;
};

export async function generateMetadata() {
  return profileMetadata();
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  noStore();

  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const requestedView = (await searchParams)?.view || null;
  const profile = (await getProfileBySlugServer(normalizedSlug)) as ProfileRecord | null;

  if (!profile) {
    const admin = createAdminClient();
    const { data: organization } = await admin
      .from("organizations")
      .select("slug")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (organization?.slug) {
      redirect(`/${organization.slug}/login`);
    }
  }

  if (
    !profile ||
    !profileCanRenderPublicly(profile) ||
    profile.consent_public_visibility !== true ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }

  const plan = getProfilePlan(profile);
  const isMultiViewProfile = plan.hasMoreProfileSections && profile.page_mode === "multi";
  const profileViews = isMultiViewProfile && profile.id ? await getProfileViewsForProfileServer(profile.id) : [];
  const defaultProfileView = isMultiViewProfile ? await getDefaultProfileViewServer(profile) : null;
  const { defaultPublicView, orderedPublicViews } = isMultiViewProfile
    ? buildPublicProfileViews(profile, profileViews, defaultProfileView)
    : {
        defaultPublicView: profileRecordToPublicProfile(profile),
        orderedPublicViews: [profileRecordToPublicProfile(profile)]
      };
  const publicNavViews = orderedPublicViews.filter((view) => view.show_in_public_nav !== false);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialAuth = user
    ? {
        email: user.email,
        fullName:
          user.user_metadata?.full_name ||
          `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim(),
        slug: null,
      }
    : null;

  return (
    <TapTaggProfileShell
      profile={defaultPublicView}
      views={orderedPublicViews}
      navViews={publicNavViews}
      pageMode={profile.page_mode || "single"}
      multiViewDisplayMode={profile.multi_view_display_mode || "favorite"}
      initialView={requestedView}
      heroLabel={defaultPublicView.business_type === "real_estate_brokerage" ? "Live property" : "Live profile"}
      initialAuth={initialAuth}
    />
  );
}
