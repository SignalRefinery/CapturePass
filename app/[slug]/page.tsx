import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPublicProfileViews,
  profileRecordToPublicProfile,
  profileViewToPublicProfile
} from "@/lib/profiles/public-view";
import { getProfilePlan } from "@/lib/plans";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isRealEstateBusiness } from "@/lib/business-types";
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
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle<ProfileRecord>();

  if (profile) {
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
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle<ProfileRecord>();

  if (!profile) {
    const businessResolution = await resolvePublicBusinessProfile({ businessSlug: normalizedSlug });

    if (businessResolution.kind === "redirect") {
      redirect(businessResolution.redirectTo);
    }

    if (businessResolution.kind === "render") {
      const { profile: businessProfile } = businessResolution;
      return (
        <CapturePassProfileShell
          profile={businessProfile}
          views={[businessProfile]}
          navViews={[businessProfile]}
          pageMode="single"
          multiViewDisplayMode="favorite"
          heroLabel="Business profile"
          initialAuth={null}
        />
      );
    }
  }

  if (!profile) {
    notFound();
  }

  const plan = getProfilePlan(profile);
  const canUseMultiViewProfile = isRealEstateBusiness(profile.business_type) && plan.hasMoreProfileSections;
  const isMultiViewProfile = canUseMultiViewProfile && profile.page_mode === "multi";
  const isDemoRealEstateProfile = normalizedSlug === "demo-real-estate";
  const profileViews = isMultiViewProfile && profile.id
    ? (await admin
        .from("profile_views")
        .select(
          `
            id,
            profile_id,
            name,
            view_key,
            sort_order,
            full_name,
            organization_name,
            role_line,
            intro,
            email,
            phone,
            text_phone,
            website_url,
            profile_badge_1,
            profile_badge_2,
            profile_badge_3,
            show_email,
            show_phone,
            show_text,
            show_in_public_nav,
            primary_link_1_title,
            primary_link_1_url,
            primary_link_1_type,
            primary_link_2_title,
            primary_link_2_url,
            primary_link_2_type,
            primary_link_3_title,
            primary_link_3_url,
            primary_link_3_type,
            primary_link_4_title,
            primary_link_4_url,
            primary_link_4_type,
            created_at,
            updated_at
          `
        )
        .eq("profile_id", profile.id)
        .order("sort_order", { ascending: true }))
        .data || []
    : [];
  const defaultProfileView = isMultiViewProfile && profile.id && profile.default_view_id
    ? (
        await admin
          .from("profile_views")
          .select(
            `
              id,
              profile_id,
              name,
              view_key,
              sort_order,
              full_name,
              organization_name,
              role_line,
              intro,
              email,
              phone,
              text_phone,
              website_url,
              profile_badge_1,
              profile_badge_2,
              profile_badge_3,
              show_email,
              show_phone,
              show_text,
              show_in_public_nav,
              primary_link_1_title,
              primary_link_1_url,
              primary_link_1_type,
              primary_link_2_title,
              primary_link_2_url,
              primary_link_2_type,
              primary_link_3_title,
              primary_link_3_url,
              primary_link_3_type,
              primary_link_4_title,
              primary_link_4_url,
              primary_link_4_type,
              created_at,
              updated_at
            `
          )
          .eq("id", profile.default_view_id)
          .eq("profile_id", profile.id)
          .maybeSingle()
      ).data || null
    : null;
  const basePublicView = profileRecordToPublicProfile(profile);
  const publicViews = profileViews.map((view) => profileViewToPublicProfile(profile, view));
  const { defaultPublicView: configuredDefaultPublicView, orderedPublicViews } = isMultiViewProfile
    ? buildPublicProfileViews(profile, profileViews, defaultProfileView)
    : {
        defaultPublicView: basePublicView,
        orderedPublicViews: [basePublicView]
      };
  const defaultPublicView = isDemoRealEstateProfile ? basePublicView : configuredDefaultPublicView;
  const displayPublicViews = isDemoRealEstateProfile
    ? [basePublicView, ...publicViews.filter((view) => view.view_id !== basePublicView.view_id)]
    : orderedPublicViews;
  const publicNavViews = displayPublicViews.filter((view) => view.show_in_public_nav !== false);
  const selectedPublicView =
    isMultiViewProfile && requestedView
      ? displayPublicViews.find((view) => view.view_id === requestedView || view.view_key === requestedView) ||
        defaultPublicView
      : defaultPublicView;

  return (
    <CapturePassProfileShell
      profile={selectedPublicView}
      views={displayPublicViews}
      navViews={publicNavViews}
      pageMode={isMultiViewProfile ? profile.page_mode || "single" : "single"}
      multiViewDisplayMode={isMultiViewProfile ? profile.multi_view_display_mode || "favorite" : "favorite"}
      initialView={requestedView}
      heroLabel={isMultiViewProfile && selectedPublicView.view_id ? "Live property" : "Live profile"}
      initialAuth={null}
    />
  );
}
