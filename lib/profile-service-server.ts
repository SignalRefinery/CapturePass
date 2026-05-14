import { createClient } from "@/lib/supabase/server";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

export async function getProfileBySlugServer(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getProfileByTokenServer(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("private_token", token)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
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
    .select("*")
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
      .select("*")
      .eq("id", profile.default_view_id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!error && data) {
      return data as ProfileViewRecord;
    }
  }

  const { data, error } = await supabase
    .from("profile_views")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileViewRecord | null;
}
