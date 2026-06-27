import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { classifySlug } from "@/lib/slug-moderation";
import { normalizeProfileButtonFieldsForStorage } from "@/lib/profile-buttons";
import { isRealEstateBusiness } from "@/lib/business-types";
import { coerceThemeForPlan, isHexColor } from "@/lib/themes";
import { getProfilePlan } from "@/lib/plans";
import { resolveSecondaryActionMode, secondaryActionModeToLegacyShowText } from "@/lib/profiles/secondary-action";

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
    .select("slug, slug_status, is_active, stripe_plan_key, business_type, billing_exempt, lifetime_free, promo_code_used, is_admin")
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

  const effectivePlanRecord: ProfileRecord = {
    ...record,
    is_active: currentProfile?.is_active ?? record.is_active,
    stripe_plan_key: currentProfile?.stripe_plan_key ?? record.stripe_plan_key,
    business_type:
      record.business_type && record.business_type !== "general_business"
        ? record.business_type
        : currentProfile?.business_type || "general_business",
    billing_exempt: currentProfile?.billing_exempt ?? record.billing_exempt,
    lifetime_free: currentProfile?.lifetime_free ?? record.lifetime_free,
    promo_code_used: currentProfile?.promo_code_used ?? record.promo_code_used,
    is_admin: currentProfile?.is_admin ?? record.is_admin
  };
  const supportsMultiViewProfiles = isRealEstateBusiness(effectivePlanRecord.business_type);

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
  const themeKey = coerceThemeForPlan(effectivePlanRecord.theme_key, getProfilePlan(effectivePlanRecord));
  const useCustomColors = themeKey === "custom";
  const secondaryActionMode = resolveSecondaryActionMode(record);

  const profilePayload = {
    user_id: userId,
    full_name: record.full_name,
    organization_name: record.organization_name || "",
    role_line: record.role_line,
    intro: record.intro,
    email: record.email,
    phone: record.phone,
    text_phone: record.text_phone || "",
    website_url: record.website_url,
    show_text: secondaryActionModeToLegacyShowText(secondaryActionMode),
    secondary_action_mode: secondaryActionMode,
    business_type:
      record.business_type && record.business_type !== "general_business"
        ? record.business_type
        : currentProfile?.business_type || "general_business",
    theme_key: themeKey,
    brand_color_primary: useCustomColors && isHexColor(record.brand_color_primary) ? record.brand_color_primary : null,
    brand_color_secondary: useCustomColors && isHexColor(record.brand_color_secondary) ? record.brand_color_secondary : null,
    brand_color_accent: useCustomColors && isHexColor(record.brand_color_accent) ? record.brand_color_accent : null,
    brand_color_background: useCustomColors && isHexColor(record.brand_color_background) ? record.brand_color_background : null,
    brand_color_text: useCustomColors && isHexColor(record.brand_color_text) ? record.brand_color_text : null,
    profile_badge_1: record.profile_badge_1 || "",
    profile_badge_2: record.profile_badge_2 || "",
    profile_badge_3: record.profile_badge_3 || "",
    consent_public_visibility: true,
    is_active: record.is_active ?? false,
    stripe_plan_key: record.stripe_plan_key || null,
    billing_exempt: record.billing_exempt ?? false,
    lifetime_free: record.lifetime_free ?? false,
    promo_code_used: record.promo_code_used || null,
    page_mode: supportsMultiViewProfiles ? record.page_mode || "single" : "single",
    multi_view_display_mode: supportsMultiViewProfiles ? record.multi_view_display_mode || "favorite" : "favorite",
    default_view_id: supportsMultiViewProfiles ? record.default_view_id || null : null,
    ...normalizeProfileButtonFieldsForStorage(record),
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
  const moderation = classifySlug(slug);

  if (moderation.state === "blocked") {
    return true;
  }

  const normalizedSlug = moderation.normalized;
  const params = new URLSearchParams({ slug: normalizedSlug, userId });
  const response = await fetch(`/api/slug/availability?${params.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to check slug availability. Please try again.");
  }

  const result = (await response.json()) as { available?: boolean };

  return !result.available;
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
        text_phone: record.text_phone || "",
        website_url: record.website_url,
        profile_badge_1: record.profile_badge_1 || "",
        profile_badge_2: record.profile_badge_2 || "",
        profile_badge_3: record.profile_badge_3 || "",
        show_email: record.show_email,
        show_phone: record.show_phone,
        show_text: record.show_text,
        show_in_public_nav: record.show_in_public_nav !== false,
        ...normalizeProfileButtonFieldsForStorage(record),
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
      text_phone: record.text_phone || "",
      website_url: record.website_url,
      profile_badge_1: record.profile_badge_1 || "",
      profile_badge_2: record.profile_badge_2 || "",
      profile_badge_3: record.profile_badge_3 || "",
      show_email: record.show_email,
      show_phone: record.show_phone,
      show_text: record.show_text,
      show_in_public_nav: record.show_in_public_nav !== false,
      ...normalizeProfileButtonFieldsForStorage(record),
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
