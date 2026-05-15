import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
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

export async function saveProfileViewClient(record: ProfileViewRecord) {
  const supabase = createBrowserClient();
  const now = new Date().toISOString();

  if (record.id) {
    return supabase
      .from("profile_views")
      .update({
        name: record.name,
        view_key: record.view_key,
        sort_order: record.sort_order,
        full_name: record.full_name,
        role_line: record.role_line,
        intro: record.intro,
        email: record.email,
        phone: record.phone,
        website_url: record.website_url,
        profile_badge_1: record.profile_badge_1 || "",
        profile_badge_2: record.profile_badge_2 || "",
        profile_badge_3: record.profile_badge_3 || "",
        show_email: record.show_email,
        show_phone: record.show_phone,
        show_text: record.show_text,
        primary_link_1_title: record.primary_link_1_title,
        primary_link_1_url: record.primary_link_1_url,
        primary_link_2_title: record.primary_link_2_title,
        primary_link_2_url: record.primary_link_2_url,
        primary_link_3_title: record.primary_link_3_title,
        primary_link_3_url: record.primary_link_3_url,
        primary_link_4_title: record.primary_link_4_title,
        primary_link_4_url: record.primary_link_4_url,
        updated_at: now
      })
      .eq("id", record.id)
      .select()
      .single();
  }

  return supabase
    .from("profile_views")
    .insert({
      profile_id: record.profile_id,
      name: record.name,
      view_key: record.view_key,
      sort_order: record.sort_order,
      full_name: record.full_name,
      role_line: record.role_line,
      intro: record.intro,
      email: record.email,
      phone: record.phone,
      website_url: record.website_url,
      profile_badge_1: record.profile_badge_1 || "",
      profile_badge_2: record.profile_badge_2 || "",
      profile_badge_3: record.profile_badge_3 || "",
      show_email: record.show_email,
      show_phone: record.show_phone,
      show_text: record.show_text,
      primary_link_1_title: record.primary_link_1_title,
      primary_link_1_url: record.primary_link_1_url,
      primary_link_2_title: record.primary_link_2_title,
      primary_link_2_url: record.primary_link_2_url,
      primary_link_3_title: record.primary_link_3_title,
      primary_link_3_url: record.primary_link_3_url,
      primary_link_4_title: record.primary_link_4_title,
      primary_link_4_url: record.primary_link_4_url,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();
}

export async function getProfileIdForUserClient(userId: string) {
  const supabase = createBrowserClient();

  return supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
}

export async function deleteProfileViewClient(viewId: string) {
  const supabase = createBrowserClient();

  return supabase.from("profile_views").delete().eq("id", viewId);
}

export async function setDefaultProfileViewClient(userId: string, viewId: string | null) {
  const supabase = createBrowserClient();

  return supabase
    .from("profiles")
    .update({
      default_view_id: viewId,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .select()
    .single();
}
