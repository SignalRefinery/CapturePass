import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { getProfilePlan } from "@/lib/plans";

export function profileViewToPublicProfile(profile: ProfileRecord, view: ProfileViewRecord) {
  const plan = getProfilePlan(profile);

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
    organization_name: view.organization_name,
    role_line: view.role_line,
    intro: view.intro,
    email: view.email,
    phone: view.phone,
    website_url: view.website_url,
    theme_key: profile.theme_key,
    brand_color_primary: profile.brand_color_primary,
    brand_color_secondary: profile.brand_color_secondary,
    brand_color_accent: profile.brand_color_accent,
    brand_color_text: profile.brand_color_text,
    profile_badge_1: plan.hasAdvancedCustomization ? view.profile_badge_1 : "",
    profile_badge_2: plan.hasAdvancedCustomization ? view.profile_badge_2 : "",
    profile_badge_3: plan.hasAdvancedCustomization ? view.profile_badge_3 : "",
    show_email: view.show_email,
    show_phone: view.show_phone,
    show_text: plan.hasCustomButtons ? view.show_text : !!view.phone,
    show_in_public_nav: view.show_in_public_nav !== false,
    primary_link_1_title: view.primary_link_1_title,
    primary_link_1_url: view.primary_link_1_url,
    primary_link_2_title: view.primary_link_2_title,
    primary_link_2_url: view.primary_link_2_url,
    primary_link_3_title: plan.hasExpandedLinks ? view.primary_link_3_title : "",
    primary_link_3_url: plan.hasExpandedLinks ? view.primary_link_3_url : "",
    primary_link_4_title: plan.hasExpandedLinks ? view.primary_link_4_title : "",
    primary_link_4_url: plan.hasExpandedLinks ? view.primary_link_4_url : ""
  };
}

export function profileRecordToPublicProfile(profile: ProfileRecord) {
  const plan = getProfilePlan(profile);

  return {
    id: profile.id,
    slug: profile.slug,
    private_token: profile.private_token,
    view_id: null,
    view_key: "profile",
    view_name: "Profile",
    full_name: profile.full_name,
    organization_name: profile.organization_name,
    role_line: profile.role_line,
    intro: profile.intro,
    email: profile.email,
    phone: profile.phone,
    website_url: profile.website_url,
    theme_key: profile.theme_key,
    brand_color_primary: profile.brand_color_primary,
    brand_color_secondary: profile.brand_color_secondary,
    brand_color_accent: profile.brand_color_accent,
    brand_color_text: profile.brand_color_text,
    profile_badge_1: plan.hasAdvancedCustomization ? profile.profile_badge_1 : "",
    profile_badge_2: plan.hasAdvancedCustomization ? profile.profile_badge_2 : "",
    profile_badge_3: plan.hasAdvancedCustomization ? profile.profile_badge_3 : "",
    show_email: true,
    show_phone: true,
    show_text: !!profile.phone,
    show_in_public_nav: true,
    primary_link_1_title: profile.primary_link_1_title,
    primary_link_1_url: profile.primary_link_1_url,
    primary_link_2_title: profile.primary_link_2_title,
    primary_link_2_url: profile.primary_link_2_url,
    primary_link_3_title: plan.hasExpandedLinks ? profile.primary_link_3_title : "",
    primary_link_3_url: plan.hasExpandedLinks ? profile.primary_link_3_url : "",
    primary_link_4_title: plan.hasExpandedLinks ? profile.primary_link_4_title : "",
    primary_link_4_url: plan.hasExpandedLinks ? profile.primary_link_4_url : ""
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
