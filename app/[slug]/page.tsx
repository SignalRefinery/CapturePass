import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import {
  getDefaultProfileViewServer,
  getProfileBySlugServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { buildPublicProfileViews, profileRecordToPublicProfile } from "@/lib/profiles/public-view";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { LuxuryProfileShell } from "@/components/profile/luxury-profile-shell";
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
  const requestedView = (await searchParams)?.view || null;
  const profile = (await getProfileBySlugServer(slug)) as ProfileRecord | null;

  if (
    !profile ||
    profile.is_active === false ||
    profile.consent_public_visibility !== true ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }

  const isMultiViewProfile = profile.page_mode === "multi";
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
    <LuxuryProfileShell
      profile={defaultPublicView}
      views={orderedPublicViews}
      navViews={publicNavViews}
      pageMode={profile.page_mode || "single"}
      multiViewDisplayMode={profile.multi_view_display_mode || "favorite"}
      initialView={requestedView}
      heroLabel="Live profile"
      initialAuth={initialAuth}
    />
  );
}
