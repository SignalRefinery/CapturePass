const EVENT_ALIASES: Record<string, string> = {
  profileview: "profile_view",
  profile_view: "profile_view",
  profileviewed: "profile_view",
  page_view: "profile_view",
  pageview: "profile_view",
  qrscan: "qr_scan",
  qr_scan: "qr_scan",
  qr_open: "qr_scan",
  qropen: "qr_scan",
  contactsubmission: "contact_submission",
  contact_submission: "contact_submission",
  contactshare: "contact_submission",
  contact_shared: "contact_submission",
  contact_share: "contact_submission",
  share_contact: "contact_submission",
  phoneclick: "phone_click",
  phone_click: "phone_click",
  emailclick: "email_click",
  email_click: "email_click",
  websiteclick: "website_click",
  website_click: "website_click",
  socialclick: "social_click",
  social_click: "social_click",
  calendlyclick: "appointment_click",
  calendar_click: "appointment_click",
  appointmentclick: "appointment_click",
  appointment_click: "appointment_click",
  vcarddownload: "vcard_download",
  vcard_download: "vcard_download",
  save_contact: "vcard_download",
  manual_follow_up_logged: "manual_follow_up_logged",
  followuplogged: "manual_follow_up_logged",
  salelogged: "sale_logged",
  sale_logged: "sale_logged",
  revenue_logged: "revenue_logged"
};

const METRIC_ALIASES: Record<string, string> = {
  contactscaptured: "contacts_captured",
  contacts_captured: "contacts_captured",
  profileviews: "profile_views",
  profile_views: "profile_views",
  qrscans: "qr_scans",
  qr_scans: "qr_scans",
  taptaggscore: "taptagg_score",
  taptagg_score: "taptagg_score",
  active_streak: "active_streak",
  monthlyscore: "monthly_score",
  monthly_score: "monthly_score",
  appointmentactions: "appointment_actions",
  appointment_actions: "appointment_actions",
  saleslogged: "sales_logged",
  sales_logged: "sales_logged",
  revenuelogged: "revenue_logged",
  revenue_logged: "revenue_logged"
};

function cleanKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function normalizeGamificationEventType(value?: string | null) {
  if (!value) return null;
  const key = cleanKey(value);
  return EVENT_ALIASES[key] || null;
}

export function normalizeGamificationMetricKey(value?: string | null) {
  if (!value) return null;
  const key = cleanKey(value);
  return METRIC_ALIASES[key] || null;
}

export function isGamificationEventType(value?: string | null) {
  return !!normalizeGamificationEventType(value);
}
