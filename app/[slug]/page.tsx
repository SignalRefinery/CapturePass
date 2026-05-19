import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import {
  getDefaultProfileViewServer,
  getProfileBySlugServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { LuxuryProfileShell } from "@/components/profile/luxury-profile-shell";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ view?: string }>;
};

export async function generateMetadata() {
  return profileMetadata();
}

function profileViewToPublicProfile(profile: ProfileRecord, view: ProfileViewRecord) {
  return {
    id: profile.id,
    slug: profile.slug,
    private_token: profile.private_token,
    view_id: view.id,
    view_key: view.view_key,
    view_name: view.name,
    full_name: view.full_name || profile.full_name,
    role_line: view.role_line || profile.role_line,
    intro: view.intro || profile.intro,
    email: view.email || profile.email,
    phone: view.phone || profile.phone,
    website_url: view.website_url || profile.website_url,
    profile_badge_1: view.profile_badge_1,
    profile_badge_2: view.profile_badge_2,
    profile_badge_3: view.profile_badge_3,
    show_email: view.show_email,
    show_phone: view.show_phone,
    show_text: view.show_text,
    primary_link_1_title: view.primary_link_1_title,
    primary_link_1_url: view.primary_link_1_url,
    primary_link_2_title: view.primary_link_2_title,
    primary_link_2_url: view.primary_link_2_url,
    primary_link_3_title: view.primary_link_3_title,
    primary_link_3_url: view.primary_link_3_url,
    primary_link_4_title: view.primary_link_4_title,
    primary_link_4_url: view.primary_link_4_url
  };
}

function profileRecordToPublicProfile(profile: ProfileRecord) {
  return {
    id: profile.id,
    slug: profile.slug,
    private_token: profile.private_token,
    view_id: null,
    view_key: "profile",
    view_name: "Profile",
    full_name: profile.full_name,
    role_line: profile.role_line,
    intro: profile.intro,
    email: profile.email,
    phone: profile.phone,
    website_url: profile.website_url,
    profile_badge_1: profile.profile_badge_1,
    profile_badge_2: profile.profile_badge_2,
    profile_badge_3: profile.profile_badge_3,
    show_email: true,
    show_phone: true,
    show_text: !!profile.phone,
    primary_link_1_title: profile.primary_link_1_title,
    primary_link_1_url: profile.primary_link_1_url,
    primary_link_2_title: profile.primary_link_2_title,
    primary_link_2_url: profile.primary_link_2_url,
    primary_link_3_title: profile.primary_link_3_title,
    primary_link_3_url: profile.primary_link_3_url,
    primary_link_4_title: profile.primary_link_4_title,
    primary_link_4_url: profile.primary_link_4_url
  };
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

  const profileViews = profile.id ? await getProfileViewsForProfileServer(profile.id) : [];
  const defaultProfileView = await getDefaultProfileViewServer(profile);
  const publicViews = profileViews.length
    ? profileViews.map((view) => profileViewToPublicProfile(profile, view))
    : [profileRecordToPublicProfile(profile)];
  const defaultPublicView = defaultProfileView
    ? profileViewToPublicProfile(profile, defaultProfileView)
    : publicViews[0];
  const orderedPublicViews =
    defaultPublicView && publicViews.length > 1
      ? [
          defaultPublicView,
          ...publicViews.filter((view) => view.view_id !== defaultPublicView.view_id)
        ]
      : publicViews;

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
      pageMode={profile.page_mode || "single"}
      multiViewDisplayMode={profile.multi_view_display_mode || "favorite"}
      initialView={requestedView}
      heroLabel="Live profile"
      initialAuth={initialAuth}
    />
  );
}
