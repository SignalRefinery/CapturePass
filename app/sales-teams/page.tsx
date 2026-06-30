import { JsonLd } from "@/components/seo/json-ld";
import { IndustryLandingPage } from "@/components/marketing/industry-landing-page";
import { buildFaqJsonLd, buildLocalBusinessJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "CapturePass for sales teams: capture contacts, share links fast, and keep lead ownership connected to the rep who built the relationship.",
  path: "/sales-teams",
  title: "Sales Teams"
});

const faqItems = [
  {
    question: "How does CapturePass help sales teams?",
    answer:
      "It gives each rep a branded profile for quick contact sharing, lead capture, and follow-up links that can be reused across the team."
  },
  {
    question: "Can it help with lead ownership?",
    answer:
      "Yes. CapturePass helps the rep who made the connection stay attached to the lead instead of losing the contact to a general company inbox."
  },
  {
    question: "Is it good for field sales?",
    answer:
      "Absolutely. CapturePass works anywhere you meet customers in person, including events, meetings, showrooms, and field visits."
  }
];

const localBusinessSchema = buildLocalBusinessJsonLd({
  description:
    "Landing page for sales teams that want CapturePass contact capture and lead ownership tools.",
  name: "CapturePass for Sales Teams",
  path: "/sales-teams"
});

export default function SalesTeamsPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <IndustryLandingPage
        actionLinks={[
          { href: "/business/pricing", label: "View Business Pricing", primary: true },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
        ]}
        audienceLabel="Sales Teams"
        benefits={[
          {
            title: "Capture the conversation",
            copy:
              "Turn a face-to-face meeting into a saved contact before the customer walks away."
          },
          {
            title: "Support team branding",
            copy:
              "Keep every rep on-brand with reusable profiles, cards, and company-controlled links."
          },
          {
            title: "Protect lead ownership",
            copy:
              "Tie the contact to the rep who actually met the customer and keep that relationship intact."
          }
        ]}
        footerLeft="Sales Teams"
        headline="CapturePass for sales teams that need the lead to stay with the rep."
        intro="Use CapturePass to move from conversation to contact to follow-up without adding friction to the meeting."
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
        ]}
        proofPoints={[
          { label: "Meeting captured", copy: "One tap or scan saves a contact while the conversation is still fresh." },
          { label: "Brand kept", copy: "Every rep can stay on-brand with the same system and template." },
          { label: "Follow-up ready", copy: "Send people directly to the next step without rebuilding the relationship flow." }
        ]}
        relatedLinks={[
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/resources/digital-business-cards-for-sales-teams", label: "Sales Guide" },
          { href: "/springfield-il-sales-team-business-cards", label: "Springfield Sales Cards" }
        ]}
        sections={[
          {
            heading: "Team accountability",
            paragraphs: [
              "Sales leaders need to know the system is being used consistently across the team and that the follow-up path stays visible.",
              "A branded CapturePass workflow makes the handoff easier to measure without forcing a heavy CRM replacement."
            ]
          },
          {
            heading: "Lead ownership",
            paragraphs: [
              "When the rep who made the connection stays attached to the lead, follow-up is cleaner and accountability improves.",
              "That matters whether the meeting happens in a showroom, at an event, or in the field."
            ]
          },
          {
            heading: "Contact capture",
            paragraphs: [
              "CapturePass gives the team a simple way to move from a quick introduction into a saved contact and a clear next step.",
              "That reduces friction when the team needs to capture names, emails, and intent in the moment."
            ]
          },
          {
            heading: "Employee turnover protection",
            paragraphs: [
              "If a salesperson leaves, the same reusable system can be reassigned instead of discarded.",
              "That keeps the original print investment alive and helps maintain continuity for the customer."
            ]
          }
        ]}
        subheadline="Make every in-person conversation easier to capture, own, and follow up."
      />
    </>
  );
}
