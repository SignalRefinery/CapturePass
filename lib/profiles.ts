import { site } from "@/lib/site";
import type { Profile, ProfileRecord, PrimaryLink } from "@/lib/types";
import { normalizeUrl } from "@/lib/utils";

const johnKeating: Profile = {
  slug: "john-keating",
  name: "John Keating",
  role: "Strategic Advisory · Public Affairs · Signal Refinery",
  intro: "A cleaner way to connect, save contact details, and move the right information forward without clutter.",
  email: "john@signalrefinery.pro",
  profileUrl: `${site.url}/john-keating`,
  phone: "(312) 593-5309",
  metaPills: ["Illinois-based", "Direct follow-up", "Verified contact card"],
  primaryLinks: [
    { title: "Call John", subtitle: "(312) 593-5309 · Direct line", href: "tel:+13125935309" },
    { title: "Signal Refinery", subtitle: "Strategic advisory, communications, and public-facing work", href: "https://signalrefinery.pro" },
    { title: "Text John", subtitle: "Send a quick message directly", href: "sms:+13125935309" },
    { title: "Download contact card", subtitle: "Save to iPhone, Android, Outlook, or desktop contacts", href: "/api/vcard/john-keating" }
  ],
  qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(`${site.url}/john-keating`)}`
};

export function getSeedProfileBySlug(slug: string): Profile | null {
  if (slug === "john-keating") return johnKeating;
  return null;
}
export function seedProfileToRecord(profile: Profile): ProfileRecord {
  return {
    slug: profile.slug,
    full_name: profile.name,
    role_line: profile.role,
    intro: profile.intro,
    email: profile.email,
    phone: profile.phone,
    website_url: "https://signalrefinery.pro",
    primary_link_1_title: profile.primaryLinks[0]?.title ?? "Call",
    primary_link_1_url: profile.primaryLinks[0]?.href ?? "",
    primary_link_2_title: profile.primaryLinks[1]?.title ?? "Website",
    primary_link_2_url: profile.primaryLinks[1]?.href ?? "",
    primary_link_3_title: profile.primaryLinks[2]?.title ?? "Text",
    primary_link_3_url: profile.primaryLinks[2]?.href ?? "",
    primary_link_4_title: profile.primaryLinks[3]?.title ?? "Download contact card",
    primary_link_4_url: profile.primaryLinks[3]?.href ?? ""
  };
}
export function profileRecordToPublicProfile(record: ProfileRecord): Profile {
  const primaryLinks: PrimaryLink[] = [
    { title: record.primary_link_1_title || "Call", subtitle: record.phone ? `${record.phone} · Direct line` : "Direct line", href: normalizeUrl(record.primary_link_1_url || "#") },
    { title: record.primary_link_2_title || "Website", subtitle: "Primary website", href: normalizeUrl(record.primary_link_2_url || record.website_url || "#") },
    { title: record.primary_link_3_title || "Text", subtitle: "Start a direct text thread", href: record.primary_link_3_url || "#" },
    { title: record.primary_link_4_title || "Download contact card", subtitle: "Save to contacts", href: record.primary_link_4_url || `/api/vcard/${record.slug}` }
  ];
  return {
    slug: record.slug,
    name: record.full_name,
    role: record.role_line,
    intro: record.intro,
    email: record.email,
    profileUrl: `${site.url}/${record.slug}`,
    phone: record.phone,
    metaPills: ["Live profile", "Direct follow-up", "Verified contact card"],
    primaryLinks,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(`${site.url}/${record.slug}`)}`
  };
}
