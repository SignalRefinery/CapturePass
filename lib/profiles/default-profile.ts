import type { User } from "@supabase/supabase-js";
import type { ProfileRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

function fallbackSlug(user: User, fullName: string, email: string) {
  return (
    user.user_metadata?.suggested_slug ||
    slugify(fullName) ||
    slugify(email.split("@")[0] || "") ||
    `profile-${user.id.slice(0, 8)}`
  );
}

export function buildDashboardProfile(user: User, existing: ProfileRecord | null): ProfileRecord {
  if (existing) {
    return {
      ...existing,
      full_name: existing.full_name || `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim(),
      email: existing.email || user.email || "",
      consent_public_visibility: !!existing.consent_public_visibility
    };
  }

  const firstName = user.user_metadata?.first_name || "";
  const lastName = user.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user.email || "";

  return {
    user_id: user.id,
    slug: fallbackSlug(user, fullName, email),
    private_token: null,
    full_name: fullName,
    role_line: "",
    intro: "",
    email,
    phone: "",
    website_url: "",
    primary_link_1_title: "Call",
    primary_link_1_url: "15551234",
    primary_link_2_title: "Email",
    primary_link_2_url: "you@yourdomain.com",
    primary_link_3_title: "Website",
    primary_link_3_url: "www.",
    primary_link_4_title: "Website 2",
    primary_link_4_url: "www.",
    is_active: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_plan_key: null,
    referral_code: null,
    referred_by: user.user_metadata?.referral_code_used || null,
    is_affiliate: false,
    affiliate_tier: null,
    billing_exempt: false,
    lifetime_free: false,
    promo_code_used: user.user_metadata?.promo_code || null,
    is_public_official: !!user.user_metadata?.is_public_official,
    slug_status: "approved",
    slug_requested: null,
    slug_review_reason: null,
    consent_public_visibility: false
  };
}
