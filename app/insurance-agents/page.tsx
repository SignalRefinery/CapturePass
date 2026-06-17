import { JsonLd } from "@/components/seo/json-ld";
import { IndustryLandingPage } from "@/components/marketing/industry-landing-page";
import { buildFaqJsonLd, buildLocalBusinessJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "TapTagg for insurance agents: share quote pages, schedule reviews, and keep your contact information easy to save and reuse.",
  path: "/insurance-agents",
  title: "Insurance Agents"
});

const faqItems = [
  {
    question: "How does TapTagg help insurance agents?",
    answer:
      "It lets agents share quote requests, review links, coverage pages, and direct contact details from one branded page."
  },
  {
    question: "Can it support policy reviews and renewals?",
    answer:
      "Yes. TapTagg makes it easy to route people to scheduling links and review pages when it is time to talk coverage again."
  },
  {
    question: "Is it useful for referrals?",
    answer:
      "Absolutely. TapTagg helps you stay top of mind so referrals can quickly save your contact and reach the right agent."
  }
];

const localBusinessSchema = buildLocalBusinessJsonLd({
  description:
    "Landing page for insurance agents and brokers who want TapTagg contact capture and review scheduling.",
  name: "TapTagg for Insurance Agents",
  path: "/insurance-agents"
});

export default function InsuranceAgentsPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <IndustryLandingPage
        actionLinks={[
          { href: "/business/pricing", label: "View Business Pricing", primary: true },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" }
        ]}
        audienceLabel="Insurance Agents"
        benefits={[
          {
            title: "Make quote follow-up easier",
            copy:
              "Move prospects from the first conversation into a quote request, review, or coverage conversation."
          },
          {
            title: "Keep referral flow simple",
            copy:
              "When someone refers a client, your TapTagg page gives them a fast path to your direct contact info."
          },
          {
            title: "Share policy support links",
            copy:
              "Route people to claims, service, scheduling, or plan information without making them search."
          }
        ]}
        footerLeft="Insurance"
        headline="TapTagg for insurance agents who want better follow-up."
        intro="Use TapTagg to make quote requests, policy reviews, and referral handoffs feel simple and immediate."
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/pricing", label: "Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
        ]}
        proofPoints={[
          { label: "Quote ready", copy: "One tap can send prospects to a quote or appointment page." },
          { label: "Coverage shared", copy: "Share service, claims, and review links without confusion." },
          { label: "Relationships kept", copy: "Your name stays attached to the client after the first conversation." }
        ]}
        relatedLinks={[
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" },
          { href: "/pricing", label: "Pricing" }
        ]}
        subheadline="Keep every quote request and referral tied to the right agent."
      />
    </>
  );
}

