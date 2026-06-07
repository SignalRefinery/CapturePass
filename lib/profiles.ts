import { site } from "@/lib/site";
import type { Profile, ProfileRecord, PrimaryLink } from "@/lib/types";
import {
  buildProfileButtons,
  inferProfileButtonType,
  normalizeProfileButtonType
} from "@/lib/profile-buttons";

const demoProfile: Profile = {
  slug: "demo-profile",
  name: "Demo Profile",
  role: "TapTagg profile",
  intro: "A clean way to share contact details, links, and next steps from one controlled profile.",
  email: "hello@example.com",
  profileUrl: `${site.url}/demo-profile`,
  phone: "",
  metaPills: ["Live profile", "Direct follow-up", "Verified contact card"],
  primaryLinks: [
    { title: "Website", subtitle: "Primary website", href: "https://example.com" }
  ],
  qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(`${site.url}/demo-profile`)}`
};

export function getSeedProfileBySlug(slug: string): Profile | null {
  if (slug === "demo-profile") return demoProfile;
  return null;
}
export function seedProfileToRecord(profile: Profile): ProfileRecord {
  const firstLinkType = inferProfileButtonType(profile.primaryLinks[0]?.href, profile.primaryLinks[0]?.title);
  const secondLinkType = inferProfileButtonType(profile.primaryLinks[1]?.href, profile.primaryLinks[1]?.title);
  const thirdLinkType = inferProfileButtonType(profile.primaryLinks[2]?.href, profile.primaryLinks[2]?.title);
  const fourthLinkType = inferProfileButtonType(profile.primaryLinks[3]?.href, profile.primaryLinks[3]?.title);

  return {
    slug: profile.slug,
    full_name: profile.name,
    role_line: profile.role,
    intro: profile.intro,
    email: profile.email,
    phone: profile.phone,
    website_url: profile.primaryLinks[0]?.href ?? "",
    primary_link_1_title: profile.primaryLinks[0]?.title ?? "",
    primary_link_1_url: profile.primaryLinks[0]?.href ?? "",
    primary_link_1_type: normalizeProfileButtonType(firstLinkType),
    primary_link_2_title: profile.primaryLinks[1]?.title ?? "",
    primary_link_2_url: profile.primaryLinks[1]?.href ?? "",
    primary_link_2_type: normalizeProfileButtonType(secondLinkType),
    primary_link_3_title: profile.primaryLinks[2]?.title ?? "",
    primary_link_3_url: profile.primaryLinks[2]?.href ?? "",
    primary_link_3_type: normalizeProfileButtonType(thirdLinkType),
    primary_link_4_title: profile.primaryLinks[3]?.title ?? "",
    primary_link_4_url: profile.primaryLinks[3]?.href ?? "",
    primary_link_4_type: normalizeProfileButtonType(fourthLinkType)
  };
}
export function profileRecordToPublicProfile(record: ProfileRecord): Profile {
  const primaryLinks: PrimaryLink[] = buildProfileButtons(record)
    .map((button) => ({
      title: button.title,
      subtitle: button.subtitle,
      href: button.href
    }))
    .filter((button) => !!button.href);
  return {
    slug: record.slug,
    name: record.full_name,
    role: record.role_line,
    intro: record.intro,
    email: record.email,
    profileUrl: `${site.url}/${record.slug}`,
    phone: record.phone,
    metaPills: ["Live profile", "Direct follow-up"],
    primaryLinks,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(`${site.url}/${record.slug}`)}`
  };
}
