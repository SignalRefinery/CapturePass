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
  role_line: string;
  intro: string;
  email: string;
  phone: string;
  website_url: string;
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_4_title: string;
  primary_link_4_url: string;
  is_active?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_plan_key?: string | null;
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

export type ProfileViewRecord = {
  id?: string;
  profile_id: string;
  name: string;
  view_key: string;
  sort_order: number;
  full_name: string;
  role_line: string;
  intro: string;
  email: string;
  phone: string;
  website_url: string;
  show_email: boolean;
  show_phone: boolean;
  show_text: boolean;
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
