export type NavLink = {
  href: string;
  label: string;
};

export type PrimaryLink = {
  title: string;
  subtitle: string;
  href: string;
};

export type Profile = {
  slug: string;
  name: string;
  role: string;
  intro: string;
  email: string;
  profileUrl: string;
  phone: string;
  metaPills: string[];
  primaryLinks: PrimaryLink[];
  qrUrl: string;
};

export type ProfileRecord = {
  id?: string;
  user_id?: string;
  slug: string;
  private_token?: string | null;
  page_mode?: "single" | "multi";
  multi_view_display_mode?: "landing" | "favorite";
  default_view_id?: string | null;
  full_name: string;
  organization_name?: string | null;
  role_line: string;
  intro: string;
  email: string;
  phone: string;
  website_url: string;
  profile_badge_1?: string | null;
  profile_badge_2?: string | null;
  profile_badge_3?: string | null;
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_4_title: string;
  primary_link_4_url: string;
  is_active?: boolean;
  is_admin?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_plan_key?: string | null;
  subscription_status?: string | null;
  subscription_current_period_end?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  is_affiliate?: boolean;
  affiliate_tier?: "founder" | "standard" | null;
  billing_exempt?: boolean;
  lifetime_free?: boolean;
  promo_code_used?: string | null;
  is_public_official?: boolean;
  slug_status?: "approved" | "pending_review" | "rejected" | null;
  slug_requested?: string | null;
  slug_review_reason?: string | null;
  consent_public_visibility?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  slug?: string | null;
  brand_color?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
  brand_theme?: "deep_brand" | "clean_light" | "full_color" | "custom" | null;
  brand_logo_url?: string | null;
  business_link_1_title?: string | null;
  business_link_1_url?: string | null;
  business_link_2_title?: string | null;
  business_link_2_url?: string | null;
  business_link_3_title?: string | null;
  business_link_3_url?: string | null;
  business_link_4_title?: string | null;
  business_link_4_url?: string | null;
  owner_user_id: string;
  managed_service_enabled?: boolean | null;
  created_at?: string;
};

export type OrganizationMemberRecord = {
  id: string;
  organization_id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  role: "owner" | "admin" | "member";
  status: "active" | "inactive";
  created_at?: string;
};

export type PassTokenRecord = {
  id: string;
  organization_id?: string | null;
  token: string;
  assigned_member_id?: string | null;
  status: "active" | "inactive" | "unassigned";
  token_type: "nfc_card" | "digital_pass" | "both";
  created_at?: string;
  updated_at?: string;
};

export type ProfileViewRecord = {
  id?: string;
  profile_id: string;
  name: string;
  view_key: string;
  sort_order: number;
  full_name: string;
  organization_name?: string | null;
  role_line: string;
  intro: string;
  email: string;
  phone: string;
  website_url: string;
  profile_badge_1?: string | null;
  profile_badge_2?: string | null;
  profile_badge_3?: string | null;
  show_email: boolean;
  show_phone: boolean;
  show_text: boolean | null;
  show_in_public_nav?: boolean;
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_4_title: string;
  primary_link_4_url: string;
  created_at?: string;
  updated_at?: string;
};
