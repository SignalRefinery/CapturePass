import { createClient } from "@/lib/supabase/server";
import { getPublicProfileBySlug, getPublicProfileByToken } from "@/lib/profiles/public-profile-source";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

export const PROFILE_VIEW_PUBLIC_SELECT = `
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
`;

export async function getProfileBySlugServer(slug: string) {
  return getPublicProfileBySlug(slug);
}

export async function getProfileByTokenServer(token: string) {
  return getPublicProfileByToken(token);
}

export async function getProfileForUserServer(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getProfileViewsForProfileServer(profileId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile_views")
    .select(PROFILE_VIEW_PUBLIC_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return (data || []) as ProfileViewRecord[];
}

export async function getDefaultProfileViewServer(profile: ProfileRecord) {
  if (!profile.id) {
    return null;
  }

  const supabase = await createClient();

  if (profile.default_view_id) {
    const { data, error } = await supabase
      .from("profile_views")
      .select(PROFILE_VIEW_PUBLIC_SELECT)
      .eq("id", profile.default_view_id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!error && data) {
      return data as ProfileViewRecord;
    }
  }

  const { data, error } = await supabase
    .from("profile_views")
    .select(PROFILE_VIEW_PUBLIC_SELECT)
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileViewRecord | null;
}
