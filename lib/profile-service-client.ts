import type { ProfileRecord } from "@/lib/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export async function saveProfileClient(record: ProfileRecord, userId: string) {
  const supabase = createBrowserClient();

  const promo = (record.promo_code_used || "").trim().toUpperCase();
  const isFounder = promo === "FOUNDERS";

  return supabase
    .from("profiles")
    .upsert(
      {
        ...record,
        user_id: userId,
        promo_code_used: promo || null,
        updated_at: new Date().toISOString(),
        ...(isFounder
          ? {
              lifetime_free: true,
              billing_exempt: true,
              stripe_plan_key: "founder"
            }
          : {})
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();
}

export async function isSlugTakenClient(slug: string, userId: string) {
  const supabase = createBrowserClient();

  const restricted = [
    "admin",
    "dashboard",
    "account",
    "pricing",
    "api",
    "login",
    "signup",
    "terms",
    "privacy",
    "partners",
    "how-it-works"
  ];

  if (restricted.includes(slug.toLowerCase())) {
    return true;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("slug", slug)
    .limit(1);

  if (error || !data || data.length === 0) return false;

  return data[0].user_id !== userId;
}