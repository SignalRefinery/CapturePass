import { createClient } from "@/lib/supabase/server";

export async function resolveProfileByTokenOrSlug({
  token,
  slug
}: {
  token?: string | null;
  slug?: string | null;
}) {
  const supabase = await createClient();

  if (token) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("private_token", token)
      .maybeSingle();

    return data || null;
  }

  if (slug) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    return data || null;
  }

  return null;
}
