import { JsonLd } from "@/components/seo/json-ld";
import { IndustryLandingPage } from "@/components/marketing/industry-landing-page";
import { buildFaqJsonLd, buildLocalBusinessJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "TapTagg for real estate agents: share listings, book showings, capture leads, and keep your name attached to the conversation.",
  path: "/real-estate-agents",
  title: "Real Estate Agents"
});

const faqItems = [
  {
    question: "How does TapTagg help real estate agents?",
    answer:
      "It gives agents a fast way to share listings, home valuation links, booking links, and their direct contact info from one page."
  },
  {
    question: "Can I use it for open houses?",
    answer:
      "Yes. TapTagg is ideal for open houses because visitors can save the agent, scan the sign, and capture contact details before they leave."
  },
  {
    question: "Will it work with my current website?",
    answer:
      "Yes. TapTagg can point to your existing listings, website, or CRM-friendly lead flow without replacing your current setup."
  }
];

const localBusinessSchema = buildLocalBusinessJsonLd({
  description:
    "Landing page for real estate agents who want TapTagg contact capture, listing sharing, and lead follow-up.",
  name: "TapTagg for Real Estate Agents",
  path: "/real-estate-agents"
});

export default function RealEstateAgentsPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <IndustryLandingPage
        actionLinks={[
          { href: "/business/pricing", label: "View Business Pricing", primary: true },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" }
        ]}
        audienceLabel="Real Estate Agents"
        benefits={[
          {
            title: "Share listings instantly",
            copy:
              "Send clients to listings, search tools, and home valuation pages from the same branded profile."
          },
          {
            title: "Capture open-house leads",
            copy:
              "Collect contact details during the showing instead of hoping the visitor remembers you later."
          },
          {
            title: "Keep your name attached",
            copy:
              "Your TapTagg profile keeps the relationship with the agent who actually met the client."
          }
        ]}
        footerLeft="Real Estate"
        headline="TapTagg for real estate agents who want stronger follow-up."
        intro="Make it easier for prospects to save you, request a showing, and stay connected after the open house or first meeting."
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/pricing", label: "Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
        ]}
        proofPoints={[
          { label: "Listing shared", copy: "One tap can send buyers straight to your active listings." },
          { label: "Lead saved", copy: "Visitors can save your info and submit contact details in seconds." },
          { label: "Open house ready", copy: "Use the same profile for signs, cards, and follow-up." }
        ]}
        relatedLinks={[
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" },
          { href: "/pricing", label: "Pricing" },
          { href: "/resources/nfc-business-cards-for-realtors", label: "Real Estate Guide" },
          { href: "/springfield-il-digital-business-cards", label: "Springfield Digital Cards" }
        ]}
        sections={[
          {
            heading: "Open houses",
            paragraphs: [
              "Open houses create a short window where visitors can become real leads, so the page should make it easy to save the agent and capture contact details.",
              "TapTagg can send visitors to the listing, a follow-up form, or a direct booking link."
            ]
          },
          {
            heading: "Vendor and referral networks",
            paragraphs: [
              "Real estate agents rely on lenders, inspectors, contractors, and other referral partners. A reusable digital page helps keep those relationships organized.",
              "That makes it easier to stay visible across the entire transaction chain."
            ]
          },
          {
            heading: "Mortgage partner relationships",
            paragraphs: [
              "Mortgage conversations often happen alongside the home search itself, so a shared digital profile helps the handoff feel natural and fast.",
              "The same page can point to lender partners, pre-qualification steps, or property search links."
            ]
          },
          {
            heading: "Property-specific use cases",
            paragraphs: [
              "You can adapt the same TapTagg setup for a listing, a neighborhood landing page, or a broader personal brand depending on the opportunity."
            ]
          }
        ]}
        subheadline="Turn showings, open houses, and referrals into saved contacts."
      />
    </>
  );
}
