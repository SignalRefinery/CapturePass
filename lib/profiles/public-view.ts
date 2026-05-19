import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

export function profileViewToPublicProfile(profile: ProfileRecord, view: ProfileViewRecord) {
  return {
    id: profile.id,
    slug: profile.slug,
    private_token: profile.private_token,
    view_id: view.id,
    view_key: view.view_key,
    view_name: view.name,
    // Multi-view profiles are intentionally isolated. Blank view fields should
    // stay blank instead of leaking the main profile's contact or link details.
    full_name: view.full_name,
    role_line: view.role_line,
    intro: view.intro,
    email: view.email,
    phone: view.phone,
    website_url: view.website_url,
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

export function profileRecordToPublicProfile(profile: ProfileRecord) {
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

export function buildPublicProfileViews(
  profile: ProfileRecord,
  profileViews: ProfileViewRecord[],
  defaultProfileView: ProfileViewRecord | null
) {
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

  return { defaultPublicView, orderedPublicViews };
}
