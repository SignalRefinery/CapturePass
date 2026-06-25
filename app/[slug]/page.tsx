import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import {
  getDefaultProfileViewServer,
  getProfileBySlugServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { buildPublicProfileViews, profileRecordToPublicProfile } from "@/lib/profiles/public-view";
import { getProfilePlan, profileCanRenderPublicly } from "@/lib/plans";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { CapturePassProfileShell } from "@/components/profile/taptagg-profile-shell";
import type { ProfileRecord } from "@/lib/types";
import { resolvePublicBusinessProfile } from "@/lib/business/public-profile-route";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ view?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const profile = (await getProfileBySlugServer(normalizedSlug)) as ProfileRecord | null;

  if (profile && profileCanRenderPublicly(profile) && isSlugPubliclyAllowed(profile.slug, profile.slug_status)) {
    return buildPublicProfileMetadata({
      description:
        profile.intro ||
        `${profile.full_name}${profile.organization_name ? ` at ${profile.organization_name}` : ""}`,
      path: `/${profile.slug}`,
      title: profile.full_name || profile.organization_name || "CapturePass Profile"
    });
  }

  if (!profile) {
    const businessResolution = await resolvePublicBusinessProfile({ businessSlug: normalizedSlug });

    if (businessResolution.kind === "render") {
      const { profile: businessProfile } = businessResolution;
      return buildPublicProfileMetadata({
        description:
          businessProfile.intro ||
          `${businessProfile.full_name}${businessProfile.organization_name ? ` at ${businessProfile.organization_name}` : ""}`,
        path: `/${businessProfile.slug}`,
        title: businessProfile.full_name || businessProfile.organization_name || "CapturePass Profile"
      });
    }
  }

  return profileMetadata();
}

function buildPublicProfileMetadata({
  description,
  path,
  title
}: {
  description: string;
  path: string;
  title: string;
}) {
  return profileMetadata({
    description,
    path,
    title,
    visibility: "public"
  });
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  noStore();

  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const requestedView = (await searchParams)?.view || null;
  const profile = (await getProfileBySlugServer(normalizedSlug)) as ProfileRecord | null;

  if (!profile) {
    const businessResolution = await resolvePublicBusinessProfile({ businessSlug: normalizedSlug });

    if (businessResolution.kind === "redirect") {
      redirect(businessResolution.redirectTo);
    }

    if (businessResolution.kind === "render") {
      const { profile: businessProfile } = businessResolution;
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
        <CapturePassProfileShell
          profile={businessProfile}
          views={[businessProfile]}
          navViews={[businessProfile]}
          pageMode="single"
          multiViewDisplayMode="favorite"
          heroLabel="Business profile"
          initialAuth={initialAuth}
        />
      );
    }
  }

  if (
    !profile ||
    !profileCanRenderPublicly(profile) ||
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
      <CapturePassProfileShell
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
