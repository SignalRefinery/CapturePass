import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { classifySlug } from "@/lib/slug-moderation";

function safeFallbackSlugForUser(userId: string) {
  return `profile-${userId.replace(/-/g, "").slice(0, 12)}`;
}

export async function saveProfileClient(record: ProfileRecord, userId: string) {
  const supabase = createBrowserClient();

  const moderation = classifySlug(record.slug || "");

  if (moderation.state === "blocked") {
    throw new Error(moderation.reason || "That slug is not allowed.");
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("slug, slug_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (currentProfileError) {
    throw new Error("Unable to check slug availability. Please try again.");
  }
  const currentSlugModeration = classifySlug(currentProfile?.slug || "");
  const safeCurrentSlug =
    currentProfile?.slug && currentSlugModeration.state !== "blocked"
      ? currentSlugModeration.normalized
      : safeFallbackSlugForUser(userId);

  if (moderation.normalized !== currentSlugModeration.normalized) {
    const slugTaken = await isSlugTakenClient(moderation.normalized, userId);

    if (slugTaken) {
      throw new Error("This slug is restricted or unavailable. Choose another slug.");
    }
  }

  const approvedReviewSlugUnchanged =
    moderation.state === "review" &&
    moderation.normalized === currentSlugModeration.normalized &&
    currentProfile?.slug_status === "approved";

  const moderatedSlugFields =
    moderation.state === "review" && !approvedReviewSlugUnchanged
      ? {
          // A review-required slug is stored as a request only. The existing
          // approved URL stays live so restricted slugs cannot bypass review.
          slug: safeCurrentSlug,
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

  const profilePayload = {
    user_id: userId,
    full_name: record.full_name,
    organization_name: record.organization_name || "",
    role_line: record.role_line,
    intro: record.intro,
    email: record.email,
    phone: record.phone,
    website_url: record.website_url,
    profile_badge_1: record.profile_badge_1 || "",
    profile_badge_2: record.profile_badge_2 || "",
    profile_badge_3: record.profile_badge_3 || "",
    primary_link_1_title: record.primary_link_1_title,
    primary_link_1_url: record.primary_link_1_url,
    primary_link_2_title: record.primary_link_2_title,
    primary_link_2_url: record.primary_link_2_url,
    primary_link_3_title: record.primary_link_3_title,
    primary_link_3_url: record.primary_link_3_url,
    primary_link_4_title: record.primary_link_4_title,
    primary_link_4_url: record.primary_link_4_url,
    consent_public_visibility: !!record.consent_public_visibility,
    page_mode: record.page_mode || "single",
    multi_view_display_mode: record.multi_view_display_mode || "favorite",
    default_view_id: record.default_view_id || null,
    ...moderatedSlugFields,
    updated_at: new Date().toISOString()
  };

  return supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
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

  if (error) {
    throw new Error("Unable to check slug availability. Please try again.");
  }

  if (data && data.length > 0 && data[0].user_id !== userId) {
    return true;
  }

  const { data: requestedData, error: requestedError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("slug_requested", normalizedSlug)
    .limit(1);

  if (requestedError) {
    throw new Error("Unable to check slug availability. Please try again.");
  }

  if (!requestedData || requestedData.length === 0) return false;

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
        organization_name: record.organization_name || "",
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
        show_in_public_nav: record.show_in_public_nav !== false,
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
      organization_name: record.organization_name || "",
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
      show_in_public_nav: record.show_in_public_nav !== false,
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
