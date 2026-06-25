import { JsonLd } from "@/components/seo/json-ld";
import { HomepagePage } from "@/components/marketing/homepage-page";
import { buildOrganizationJsonLd, buildPageMetadata, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
  title: "CapturePass"
});

const businessCards = [
  {
    href: "/sales-teams",
    title: "Sales Teams",
    copy: "Turn conversations into captured contacts and measurable opportunities."
  },
  {
    href: "/dealerships",
    title: "Automotive Dealerships",
    copy: "Keep buyers connected to the right salesperson, inventory, and follow-up process."
  },
  {
    href: "/real-estate-agents",
    title: "Real Estate",
    copy: "Strengthen relationships with buyers, sellers, open house visitors, and referral partners."
  },
  {
    href: "/insurance-agents",
    title: "Insurance",
    copy: "Simplify referrals, quote requests, reviews, and ongoing client relationships."
  },
  {
    title: "Recruiting & Staffing",
    copy: "Capture candidate information and keep hiring conversations moving."
  },
  {
    title: "Professional Services",
    copy: "Help clients, prospects, and referral sources stay connected to your business."
  }
];

const teamCapabilities = [
  "Individual and team profiles",
  "Contact capture",
  "Business branding",
  "Team management",
  "Analytics",
  "Flexible calls-to-action",
  "CRM-ready workflows",
  "Instant updates without replacing cards"
];

const resourceLinks = [
  { href: "/resources", label: "Resource Center" },
  { href: "/resources/category/sales", label: "Sales Resources" },
  { href: "/resources/category/dealerships", label: "Dealership Resources" },
  { href: "/contact-capture-nfc-cards", label: "NFC Business Cards" }
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <HomepagePage
        businessCards={businessCards}
        footerLeft="Turn Every Handshake Into a Prospect."
        resourceLinks={resourceLinks}
        teamCapabilities={teamCapabilities}
      />
    </>
  );
}
