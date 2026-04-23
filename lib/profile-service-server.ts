import { createClient } from "@/lib/supabase/server";

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
