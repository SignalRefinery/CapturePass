import type { BusinessType } from "@/lib/business-types";
import type { ProfileButtonType } from "@/lib/profile-buttons";

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
  business_type?: BusinessType | null;
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
  show_text?: boolean | null;
  theme_key?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
  brand_color_background?: string | null;
  brand_color_text?: string | null;
  brand_logo_url?: string | null;
  profile_badge_1?: string | null;
  profile_badge_2?: string | null;
  profile_badge_3?: string | null;
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_1_type?: ProfileButtonType | null;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_2_type?: ProfileButtonType | null;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_3_type?: ProfileButtonType | null;
  primary_link_4_title: string;
  primary_link_4_url: string;
  primary_link_4_type?: ProfileButtonType | null;
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
  registration_notification_sent_at?: string | null;
  card_notification_sent_at?: string | null;
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
  brand_color_background?: string | null;
  brand_color_text?: string | null;
  theme_key?: string | null;
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
  business_type?: BusinessType | null;
  owner_user_id: string;
  managed_service_enabled?: boolean | null;
  business_plan_key?: string | null;
  business_billing_interval?: "monthly" | "annual" | null;
  seat_limit?: number | null;
  included_card_count?: number | null;
  is_managed?: boolean | null;
  setup_fee_paid_at?: string | null;
  card_allotment_total?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  created_at?: string;
};

export type BusinessRole = "super_admin" | "business_admin" | "location_admin" | "employee";

export type BusinessLocationRecord = {
  id: string;
  business_id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  region_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BusinessRegionRecord = {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  state_codes?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationMemberRecord = {
  id: string;
  organization_id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  headshot_url?: string | null;
  phone?: string | null;
  title?: string | null;
  role: "owner" | "admin" | "member" | BusinessRole;
  location_id?: string | null;
  status: "active" | "inactive";
  created_at?: string;
};

export type OrganizationWebhookRecord = {
  id: string;
  organization_id: string;
  enabled: boolean;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WebhookDeliveryRecord = {
  id: string;
  organization_id: string;
  event_type: string;
  status_code?: number | null;
  success: boolean;
  attempted_at?: string;
  response_body?: string | null;
  error_message?: string | null;
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

export type ContactSubmissionRecord = {
  id: string;
  profile_id: string;
  organization_id?: string | null;
  profile_view_id?: string | null;
  submitted_to_user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  note?: string | null;
  source?: string | null;
  user_agent?: string | null;
  consent_to_contact?: boolean | null;
  consent_text?: string | null;
  consent_given_at?: string | null;
  source_profile_slug?: string | null;
  source_url?: string | null;
  ip_address?: string | null;
  created_at?: string;
};

export type AnalyticsEventRecord = {
  id: string;
  event_type:
    | "profile_view"
    | "profileViewed"
    | "page_view"
    | "qr_scan"
    | "qrScan"
    | "qr_open"
    | "nfc_tap"
    | "direct_visit"
    | "shared_link_visit"
    | "button_click"
    | "email_click"
    | "phone_click"
    | "website_click"
    | "social_click"
    | "appointment_click"
    | "manual_follow_up_logged"
    | "sale_logged"
    | "revenue_logged"
    | "vcard_download"
    | "contact_save"
    | "contact_shared"
    | "contact_submission"
    | "card_assigned"
    | "card_reassigned"
    | "employee_activated"
    | "employee_deactivated";
  profile_id?: string | null;
  organization_id?: string | null;
  organization_member_id?: string | null;
  location_id?: string | null;
  region_id?: string | null;
  profile_view_id?: string | null;
  user_id?: string | null;
  card_id?: string | null;
  source?: string | null;
  action_type?: string | null;
  action_label?: string | null;
  action_url?: string | null;
  visitor_id?: string | null;
  session_id?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  ip_hash?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
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
  primary_link_1_type?: ProfileButtonType | null;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_2_type?: ProfileButtonType | null;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_3_type?: ProfileButtonType | null;
  primary_link_4_title: string;
  primary_link_4_url: string;
  primary_link_4_type?: ProfileButtonType | null;
  created_at?: string;
  updated_at?: string;
};

export type GamificationMetricKey =
  | "contacts_captured"
  | "profile_views"
  | "qr_scans"
  | "taptagg_score"
  | "active_streak"
  | "monthly_score"
  | "appointment_actions"
  | "sales_logged"
  | "revenue_logged";

export type GamificationScoreBreakdown = {
  total: number;
  breakdown: Record<string, number>;
};

export type BadgeDefinition = {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  category: string;
  icon?: string | null;
  point_bonus?: number | null;
  threshold_value?: number | null;
  metric_key?: GamificationMetricKey | string | null;
  is_active?: boolean | null;
  created_at?: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_key: string;
  earned_at?: string;
  period_start?: string | null;
  period_end?: string | null;
  metadata?: Record<string, unknown>;
};

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  name: string;
  organization_member_id?: string | null;
  contacts_captured: number;
  profile_views: number;
  qr_scans: number;
  phone_clicks: number;
  appointment_clicks: number;
  sales_logged: number;
  revenue_logged: number;
  taptagg_score: number;
};

export type TeamChallenge = {
  id: string;
  organization_id: string;
  created_by?: string | null;
  title: string;
  description?: string | null;
  metric_key: GamificationMetricKey | string;
  goal_value: number;
  start_date: string;
  end_date: string;
  prize?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ChallengeProgress = {
  challenge: TeamChallenge;
  progress_value: number;
  goal_value: number;
  percent: number;
  days_remaining: number;
  top_contributors: LeaderboardRow[];
};

export type Competition = {
  id: string;
  organization_id: string;
  title: string;
  metric_key: GamificationMetricKey | string;
  start_date: string;
  end_date: string;
  prize?: string | null;
  status?: string | null;
  created_by?: string | null;
  created_at?: string;
};

export type CompetitionResult = {
  id: string;
  competition_id: string;
  user_id: string;
  rank: number;
  score_value: number;
  calculated_at?: string;
  metadata?: Record<string, unknown>;
};

export type SalesAttributionEvent = {
  id: string;
  organization_id?: string | null;
  profile_id?: string | null;
  owner_user_id: string;
  contact_submission_id?: string | null;
  attribution_type:
    | "appointment_booked"
    | "follow_up_logged"
    | "opportunity_created"
    | "sale_logged"
    | "revenue_logged";
  revenue_amount?: string | number | null;
  deal_name?: string | null;
  customer_name?: string | null;
  notes?: string | null;
  source?: string | null;
  occurred_at?: string;
  created_at?: string;
  updated_at?: string;
};
