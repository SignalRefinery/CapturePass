import { JsonLd } from "@/components/seo/json-ld";
import { IndustryLandingPage } from "@/components/marketing/industry-landing-page";
import {
  buildFaqJsonLd,
  buildPageMetadata,
  buildSoftwareApplicationJsonLd
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "Contact capture NFC cards from CapturePass: one tap or scan to share your profile, save a contact, and keep follow-up simple.",
  path: "/contact-capture-nfc-cards",
  title: "Contact Capture NFC Cards"
});

const faqItems = [
  {
    question: "What is a contact capture NFC card?",
    answer:
      "It is a CapturePass card that opens your profile and contact capture flow so people can save you or share their information in seconds."
  },
  {
    question: "Do contacts need an app?",
    answer:
      "No. The page opens in a normal browser after a tap or scan, which keeps the experience simple for every recipient."
  },
  {
    question: "Why is contact capture useful?",
    answer:
      "It helps you turn a conversation into a saved contact and a follow-up opportunity before the moment is forgotten."
  }
];

const softwareApplicationSchema = buildSoftwareApplicationJsonLd({
  description:
    "CapturePass contact capture NFC cards for teams and individuals who want a fast tap-to-save workflow.",
  name: "CapturePass Contact Capture NFC Cards",
  path: "/contact-capture-nfc-cards",
});

export default function ContactCaptureNfcCardsPage() {
  return (
    <>
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <IndustryLandingPage
        actionLinks={[
          { href: "/business-individual", label: "Business Individual", primary: true },
          { href: "/business/pricing", label: "Business Pricing" }
        ]}
        audienceLabel="Contact Capture NFC Cards"
        benefits={[
          {
            title: "Save contacts faster",
            copy:
              "Use a tap or scan to open a contact capture flow that helps people save your details right away."
          },
          {
            title: "Works without an app",
            copy:
              "The recipient only needs a browser, which removes friction and keeps the handoff simple."
          },
          {
            title: "Built for follow-up",
            copy:
              "Every card is designed to move someone from a quick encounter to a saved contact and next step."
          }
        ]}
        footerLeft="Contact Capture"
        headline="CapturePass contact capture NFC cards that turn quick meetings into saved contacts."
        intro="If your goal is to make people save your contact before they leave, this is the fastest path in the CapturePass funnel."
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/dealerships", label: "Dealerships" }
        ]}
        proofPoints={[
          { label: "Tap to save", copy: "A tap or scan sends people to the right profile or contact flow." },
          { label: "No app needed", copy: "Recipients can save your info from the browser they already use." },
          { label: "Follow-up ready", copy: "Convert face-to-face meetings into contacts before the opportunity cools off." }
        ]}
        relatedLinks={[
          { href: "/business-individual", label: "Business Individual" },
          { href: "/business", label: "Business" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/resources/contact-capture-vs-traditional-business-cards", label: "Traditional Cards vs Contact Capture" },
          { href: "/springfield-il-contact-capture", label: "Springfield Contact Capture" }
        ]}
        sections={[
          {
            heading: "Why paper business cards fail",
            paragraphs: [
              "Paper cards are easy to hand out but easy to forget, which means the conversation often ends at the exchange itself.",
              "They also do nothing to help capture the other person's information or move the conversation forward."
            ]
          },
          {
            heading: "How contact capture works",
            paragraphs: [
              "A tap or scan opens a page that can share your profile, collect the recipient's contact details, and give both sides a clear next step.",
              "That keeps the exchange simple while making the follow-up much more useful."
            ]
          },
          {
            heading: "CRM-ready workflows",
            paragraphs: [
              "Teams can design the page so the contact flows into their existing follow-up process instead of creating another disconnected tool.",
              "That makes it easier to keep records clean and avoid manual re-entry."
            ]
          },
          {
            heading: "Follow-up and conversion benefits",
            paragraphs: [
              "The faster the recipient sees a useful next step, the more likely the conversation turns into an actual opportunity.",
              "Contact capture creates a stronger bridge between the first meeting and the next action."
            ]
          }
        ]}
        subheadline="Make contact capture feel instant, simple, and branded."
      />
    </>
  );
}
