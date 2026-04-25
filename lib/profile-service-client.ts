import type { ProfileRecord } from "@/lib/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { classifySlug } from "@/lib/slug-moderation";

export async function saveProfileClient(record: ProfileRecord, userId: string) {
  const supabase = createBrowserClient();

  const promo = (record.promo_code_used || "").trim().toUpperCase();
  const isFounder = promo === "FOUNDERS";

  const moderation = classifySlug(record.slug || "");

  if (moderation.state === "blocked") {
    throw new Error(moderation.reason || "That slug is not allowed.");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("user_id", userId)
    .maybeSingle();

  const moderatedSlugFields =
    moderation.state === "review"
      ? {
          slug: currentProfile?.slug || record.slug,
          slug_requested: moderation.normalized,
          slug_status: "pending_review",
          slug_review_reason: moderation.reason
        }
      : {
          slug: moderation.normalized,
          slug_requested: null,
          slug_status: "approved",
          slug_review_reason: null
        };

  return supabase
    .from("profiles")
    .upsert(
      {
        ...record,
        user_id: userId,
        ...moderatedSlugFields,
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

  const moderation = classifySlug(slug);

  if (moderation.state === "blocked") {
    return true;
  }

  const normalizedSlug = moderation.normalized;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("slug", normalizedSlug)
    .limit(1);

  if (error) return false;

  if (data && data.length > 0 && data[0].user_id !== userId) {
    return true;
  }

  const { data: requestedData, error: requestedError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("slug_requested", normalizedSlug)
    .limit(1);

  if (requestedError || !requestedData || requestedData.length === 0) return false;

  return requestedData[0].user_id !== userId;
}