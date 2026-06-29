import { JsonLd } from "@/components/seo/json-ld";
import { HomepagePage } from "@/components/marketing/homepage-page";
import { buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

async function getInitialAuth() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    email: user.email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}

export const metadata = buildPageMetadata({
  description:
    "CapturePass helps professionals and teams share contact information instantly, capture leads, track engagement, and turn everyday introductions into customers.",
  path: "/",
  title: "CapturePass | Digital Business Cards with Lead Capture"
});

const businessCards = [
  {
    href: "/sales-teams",
    title: "Sales Teams",
    copy: "Turn conversations into captured contacts and measurable follow-up."
  },
  {
    href: "/dealerships",
    title: "Automotive Dealerships",
    copy: "Help every salesperson share a polished profile and capture more buyer interest."
  },
  {
    href: "/real-estate-agents",
    title: "Real Estate",
    copy: "Make it easier for prospects, buyers, sellers, and referral partners to remember and contact you."
  },
  {
    href: "/insurance-agents",
    title: "Insurance",
    copy: "Capture policy shoppers, referral partners, and renewal opportunities from everyday conversations."
  },
  {
    title: "Recruiting & Staffing",
    copy: "Give candidates and employers a faster way to connect and stay in touch."
  },
  {
    title: "Professional Services",
    copy: "Turn consultations, referrals, and networking conversations into follow-up opportunities."
  }
];

const teamCapabilities = [
  "Individual and team profiles",
  "Contact capture",
  "Business branding",
  "Team management",
  "Analytics",
  "CRM-ready workflows",
  "Instant profile updates",
  "Mobile-friendly profiles"
];

const resourceLinks = [
  { href: "/resources", label: "Resource Center" },
  { href: "/resources/category/sales", label: "Sales Resources" },
  { href: "/resources/category/dealerships", label: "Dealership Resources" },
  { href: "/contact-capture-nfc-cards", label: "NFC Business Cards" }
];

export default async function HomePage() {
  const initialAuth = await getInitialAuth();

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <HomepagePage
        businessCards={businessCards}
        footerLeft="Turn Every Handshake Into a Prospect."
        initialAuth={initialAuth}
        resourceLinks={resourceLinks}
        teamCapabilities={teamCapabilities}
      />
    </>
  );
}
