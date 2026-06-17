import { JsonLd } from "@/components/seo/json-ld";
import { IndustryLandingPage } from "@/components/marketing/industry-landing-page";
import { buildFaqJsonLd, buildLocalBusinessJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "TapTagg for dealerships: capture leads, share inventory, book test drives, and keep customers connected to the right salesperson.",
  path: "/dealerships",
  title: "Dealerships"
});

const faqItems = [
  {
    question: "How does TapTagg help dealerships?",
    answer:
      "It gives salespeople a fast way to share their contact info, inventory links, test-drive booking, and follow-up pages while keeping lead ownership tied to the rep."
  },
  {
    question: "Can cards be reassigned when staff changes?",
    answer:
      "Yes. TapTagg is built so dealership cards and profiles can move with the team instead of forcing a reprint every time someone leaves or changes roles."
  },
  {
    question: "Does TapTagg work without an app?",
    answer:
      "Yes. Customers open the page in their browser after a tap or scan, which makes it easy to save the salesperson and keep moving through the sales process."
  }
];

const localBusinessSchema = buildLocalBusinessJsonLd({
  description:
    "Landing page for dealerships that need TapTagg contact capture, inventory sharing, and lead ownership.",
  name: "TapTagg for Dealerships",
  path: "/dealerships"
});

export default function DealershipsPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <IndustryLandingPage
        actionLinks={[
          { href: "/business/pricing", label: "View Business Pricing", primary: true },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" }
        ]}
        audienceLabel="Dealerships"
        benefits={[
          {
            title: "Keep the right rep attached to the deal",
            copy:
              "Every salesperson can share a branded TapTagg profile that keeps leads tied to the rep, not just the showroom."
          },
          {
            title: "Move inventory and test drives faster",
            copy:
              "Send customers to inventory, pre-approval, trade-in, or test-drive links instantly from the same tap or scan."
          },
          {
            title: "Reassign cards without reprinting",
            copy:
              "When staff changes, TapTagg profiles and cards can be updated instead of discarded."
          }
        ]}
        footerLeft="Dealerships"
        headline="TapTagg for dealerships that want the lead to stay with the rep."
        intro="Use TapTagg to bridge the gap between the conversation on the lot and the follow-up after the customer leaves."
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/pricing", label: "Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
        ]}
        proofPoints={[
          { label: "Inventory shared", copy: "One tap can route shoppers to inventory, specials, and trade-in tools." },
          { label: "Lead captured", copy: "Turn the lot conversation into an owned contact and next-step follow-up." },
          { label: "Card reused", copy: "Update reps or locations without reprinting the whole stack." }
        ]}
        relatedLinks={[
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" },
          { href: "/pricing", label: "Pricing" }
        ]}
        subheadline="Turn every showroom conversation into a saved contact and a cleaner follow-up path."
      />
    </>
  );
}

