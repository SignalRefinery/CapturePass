import type { BusinessType } from "@/lib/business-types";
import { buildQuickChartQrUrl } from "@/lib/notifications/qr";
import { getSiteOrigin } from "@/lib/site-url";
import { normalizeProfileButtonType } from "@/lib/profile-buttons";
import demoCenterData from "@/lib/demo-center-data.json";

type DemoPrimaryLink = {
  title: string;
  url: string;
  type: string;
};

type DemoProfileConfig = {
  slug: string;
  private_token?: string;
  full_name: string;
  role_line: string;
  organization_name: string;
  intro: string;
  email: string;
  phone: string;
  text_phone: string;
  website_url: string;
  profile_badge_1?: string;
  profile_badge_2?: string;
  profile_badge_3?: string;
  page_mode?: "single" | "multi";
  multi_view_display_mode?: "landing" | "favorite";
  default_view_key?: string;
  theme_key?: "capturepass_brand" | "tt_classic" | "modern_slate" | "executive_gold" | "clean_horizon" | "modern_rose" | "custom";
  primary_links: DemoPrimaryLink[];
};

type DemoViewConfig = {
  view_key: string;
  name: string;
  sort_order: number;
  full_name: string;
  organization_name: string;
  role_line: string;
  intro: string;
  email: string;
  phone: string;
  text_phone: string;
  website_url: string;
  profile_badge_1?: string;
  profile_badge_2?: string;
  profile_badge_3?: string;
  show_in_public_nav?: boolean;
  primary_links: DemoPrimaryLink[];
};

type DemoDefinition = {
  slug: string;
  businessType: BusinessType;
  audienceLabel?: string;
  summary: string;
  profile: DemoProfileConfig;
  views?: DemoViewConfig[];
};

type RawDemoCenterData = {
  demos: DemoDefinition[];
};

const demoCenterConfig = demoCenterData as RawDemoCenterData;

export type DemoCenterDemo = DemoDefinition & {
  profileUrl: string;
  digitalPassUrl: string;
  qrUrl: string;
  viewCount: number;
  audienceLabelText: string;
};

export type DemoCenterProfileInsert = {
  slug: string;
  business_type: BusinessType;
  private_token: string | null;
  full_name: string;
  role_line: string;
  organization_name: string;
  intro: string;
  email: string;
  phone: string;
  text_phone: string;
  website_url: string;
  profile_badge_1: string;
  profile_badge_2: string;
  profile_badge_3: string;
  page_mode: "single" | "multi";
  multi_view_display_mode: "landing" | "favorite";
  default_view_id?: string | null;
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_1_type: string;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_2_type: string;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_3_type: string;
  primary_link_4_title: string;
  primary_link_4_url: string;
  primary_link_4_type: string;
  is_active: boolean;
  consent_public_visibility: boolean;
  slug_status: "approved";
  theme_key: "capturepass_brand" | "tt_classic" | "modern_slate" | "executive_gold" | "clean_horizon" | "modern_rose" | "custom";
  stripe_plan_key: "creator";
  show_text: boolean;
  updated_at: string;
};

export type DemoCenterViewInsert = {
  view_key: string;
  name: string;
  sort_order: number;
  full_name: string;
  organization_name: string;
  role_line: string;
  intro: string;
  email: string;
  phone: string;
  text_phone: string;
  website_url: string;
  profile_badge_1: string;
  profile_badge_2: string;
  profile_badge_3: string;
  show_email: boolean;
  show_phone: boolean;
  show_text: boolean;
  show_in_public_nav: boolean;
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_1_type: string;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_2_type: string;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_3_type: string;
  primary_link_4_title: string;
  primary_link_4_url: string;
  primary_link_4_type: string;
  updated_at: string;
};

function normalizeLinkType(type: string) {
  return normalizeProfileButtonType(type);
}

export function getDemoCenterDemos(): DemoCenterDemo[] {
  const siteOrigin = getSiteOrigin();

  return demoCenterConfig.demos.map((demo) => ({
    ...demo,
    profileUrl: `${siteOrigin}/${demo.slug}`,
    digitalPassUrl: demo.profile.private_token ? `${siteOrigin}/pass/${demo.profile.private_token}` : "",
    qrUrl: buildQuickChartQrUrl(`${siteOrigin}/${demo.slug}`) || "",
    viewCount: demo.views?.length || 0,
    audienceLabelText: demo.audienceLabel || ""
  }));
}

export function getDemoBySlug(slug: string) {
  return demoCenterConfig.demos.find((demo) => demo.slug === slug) || null;
}

export function buildDemoProfileInsert(demo: DemoDefinition): DemoCenterProfileInsert {
  const now = new Date().toISOString();

  return {
    slug: demo.profile.slug,
    business_type: demo.businessType,
    full_name: demo.profile.full_name,
    role_line: demo.profile.role_line,
    organization_name: demo.profile.organization_name,
    intro: demo.profile.intro,
    email: demo.profile.email,
    phone: demo.profile.phone,
    text_phone: demo.profile.text_phone,
    website_url: demo.profile.website_url,
    private_token: demo.profile.private_token || null,
    profile_badge_1: demo.profile.profile_badge_1 || "",
    profile_badge_2: demo.profile.profile_badge_2 || "",
    profile_badge_3: demo.profile.profile_badge_3 || "",
    page_mode: demo.profile.page_mode || "single",
    multi_view_display_mode: demo.profile.multi_view_display_mode || "favorite",
    default_view_id: null,
    primary_link_1_title: demo.profile.primary_links[0]?.title || "",
    primary_link_1_url: demo.profile.primary_links[0]?.url || "",
    primary_link_1_type: normalizeLinkType(demo.profile.primary_links[0]?.type || "website"),
    primary_link_2_title: demo.profile.primary_links[1]?.title || "",
    primary_link_2_url: demo.profile.primary_links[1]?.url || "",
    primary_link_2_type: normalizeLinkType(demo.profile.primary_links[1]?.type || "website"),
    primary_link_3_title: demo.profile.primary_links[2]?.title || "",
    primary_link_3_url: demo.profile.primary_links[2]?.url || "",
    primary_link_3_type: normalizeLinkType(demo.profile.primary_links[2]?.type || "website"),
    primary_link_4_title: demo.profile.primary_links[3]?.title || "",
    primary_link_4_url: demo.profile.primary_links[3]?.url || "",
    primary_link_4_type: normalizeLinkType(demo.profile.primary_links[3]?.type || "website"),
    is_active: true,
    consent_public_visibility: true,
    slug_status: "approved",
    theme_key: demo.profile.theme_key || "capturepass_brand",
    stripe_plan_key: "creator",
    show_text: true,
    updated_at: now
  };
}

export function buildDemoViewInsert(view: DemoViewConfig): DemoCenterViewInsert {
  const now = new Date().toISOString();

  return {
    view_key: view.view_key,
    name: view.name,
    sort_order: view.sort_order,
    full_name: view.full_name,
    organization_name: view.organization_name,
    role_line: view.role_line,
    intro: view.intro,
    email: view.email,
    phone: view.phone,
    text_phone: view.text_phone,
    website_url: view.website_url,
    profile_badge_1: view.profile_badge_1 || "",
    profile_badge_2: view.profile_badge_2 || "",
    profile_badge_3: view.profile_badge_3 || "",
    show_email: true,
    show_phone: true,
    show_text: true,
    show_in_public_nav: view.show_in_public_nav !== false,
    primary_link_1_title: view.primary_links[0]?.title || "",
    primary_link_1_url: view.primary_links[0]?.url || "",
    primary_link_1_type: normalizeLinkType(view.primary_links[0]?.type || "website"),
    primary_link_2_title: view.primary_links[1]?.title || "",
    primary_link_2_url: view.primary_links[1]?.url || "",
    primary_link_2_type: normalizeLinkType(view.primary_links[1]?.type || "website"),
    primary_link_3_title: view.primary_links[2]?.title || "",
    primary_link_3_url: view.primary_links[2]?.url || "",
    primary_link_3_type: normalizeLinkType(view.primary_links[2]?.type || "website"),
    primary_link_4_title: view.primary_links[3]?.title || "",
    primary_link_4_url: view.primary_links[3]?.url || "",
    primary_link_4_type: normalizeLinkType(view.primary_links[3]?.type || "website"),
    updated_at: now
  };
}

export function getDemoViewUrl(demoSlug: string, viewKey: string) {
  return `${getSiteOrigin()}/${demoSlug}?view=${encodeURIComponent(viewKey)}`;
}
