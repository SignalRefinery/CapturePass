import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";

const canonicalUrl = "https://capturepass.com/best-digital-business-card-for-real-estate-agents";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See why real estate agents use CapturePass to capture leads, strengthen referrals, improve open house follow-up, and stay connected with buyers, sellers, and local partners using NFC business cards and mobile QR codes.",
  path: "/best-digital-business-card-for-real-estate-agents",
  title: "Best Contact Capture Platform For Real Estate Agents | CapturePass"
});

const openGraph = metadata.openGraph;
const twitter = metadata.twitter;

const heroCopy = [
  "Real estate agents do not just sell homes.",
  "They build trust before the listing appointment.",
  "They stay visible before the buyer is ready.",
  "They maintain referral relationships with lenders, inspectors, insurance agents, attorneys, contractors, and past clients.",
  "They meet future clients long before those clients are ready to move.",
  "That is why real estate professionals need more than a paper business card.",
  "They need a better way to turn conversations into relationships.",
  "CapturePass was designed around that idea."
];

const opportunityCopy = [
  "Real estate opportunities rarely come from one channel.",
  "They come from:",
  "Open houses",
  "Listing appointments",
  "Buyer consultations",
  "Local events",
  "School and community activities",
  "Referral partners",
  "Past clients",
  "Social conversations",
  "Vendors and contractors",
  "Mortgage and insurance relationships",
  "Every conversation has potential value.",
  "The challenge is not meeting people.",
  "The challenge is staying connected after the conversation ends.",
  "A buyer may not be ready today.",
  "A seller may be six months away.",
  "A referral partner may not have someone to send right now.",
  "A past client may know someone next year.",
  "If the relationship fades, the opportunity fades with it.",
  "CapturePass helps real estate professionals make those connections easier to capture, easier to continue, and easier to remember."
];

const needRows = [
  {
    need: "Instant contact sharing",
    why: "Make it easy for buyers, sellers, and partners to save your information."
  },
  {
    need: "Contact capture",
    why: "Turn open house visitors and networking conversations into follow-up opportunities."
  },
  {
    need: "Open house follow-up",
    why: "Capture visitor details and make the next conversation easier."
  },
  {
    need: "Referral partner connections",
    why: "Stay connected with lenders, inspectors, insurance agents, attorneys, and contractors."
  },
  {
    need: "Professional branding",
    why: "Present a polished experience across every interaction."
  },
  {
    need: "Team visibility",
    why: "Help brokerages understand adoption and engagement."
  },
  {
    need: "Relationship retention",
    why: "Stay connected with past clients and future referrals."
  }
] as const;

const openHouseCopy = [
  "Open houses are one of the clearest use cases for contact capture and mobile QR codes.",
  "Visitors walk through.",
  "Some are serious buyers.",
  "Some are neighbors.",
  "Some are early in the process.",
  "Some are already working with an agent.",
  "Some are just starting to think about moving.",
  "A paper sign-in sheet may collect a name and number.",
  "But it does not create a modern follow-up experience.",
  "CapturePass helps agents make open house interactions smoother by making it easier to share information and capture contact details in the moment.",
  "The more friction you remove, the easier it becomes to continue the conversation."
];

const referralCopy = [
  "Real estate is powered by referrals.",
  "A past client introduces a friend.",
  "A lender recommends an agent.",
  "An insurance agent knows someone buying a home.",
  "A contractor meets a homeowner thinking about selling.",
  "A neighbor mentions a family member moving to town.",
  "Those conversations matter.",
  "But referrals only become business when the relationship is maintained.",
  "CapturePass helps agents stay easier to remember, easier to contact, and easier to refer.",
  "That is the real value."
];

const captureCopy = [
  "Most contact-sharing platforms focus on helping agents share their information.",
  "That is useful.",
  "But sharing information is only half the equation.",
  "Capturing information creates opportunity.",
  "If a buyer saves your contact information, that is good.",
  "If you also receive their information, that is better.",
  "Now there is a reason to follow up.",
  "Now there is a relationship to build.",
  "Now there is an opportunity to track.",
  "That difference matters in real estate because timing is everything.",
  "People may be months or years away from making a move.",
  "The agent who stays connected is often the agent who gets the call."
];

const brokerageCopy = [
  "Brokerages often think differently than individual agents.",
  "They care about:",
  "Brand consistency",
  "Agent adoption",
  "Lead capture",
  "Referral relationships",
  "Professional presentation",
  "Long-term growth",
  "A brokerage does not just need agents to look professional.",
  "It needs systems that help agents create and retain opportunities.",
  "That is why many brokerages look beyond simple contact-sharing tools and evaluate tools that support contact capture, team visibility, and relationship retention."
];

const chooseCopy = [
  "Real estate professionals choose CapturePass because it aligns with how real estate relationships actually work.",
  "Not just sharing information.",
  "Not just replacing paper cards.",
  "Building trust.",
  "Capturing opportunities.",
  "Supporting referrals.",
  "Improving follow-up.",
  "Helping conversations become clients.",
  "That is why CapturePass is more than a contact-sharing tool.",
  "It is a relationship-building tool for real estate professionals."
];

const faqItems = [
  {
    question: "Are contact capture platforms useful for real estate agents?",
    answer:
      "Yes. They make it easier for agents to share contact information, capture leads, support open house follow-up, and stay connected with buyers, sellers, and referral partners."
  },
  {
    question: "Can contact capture platforms help with open houses?",
    answer:
      "Yes. Contact capture platforms can make it easier to share information and collect visitor contact details during open houses."
  },
  {
    question: "Does CapturePass support contact capture?",
    answer:
      "Yes. CapturePass includes contact capture functionality designed to help agents collect prospect information and support follow-up."
  },
  {
    question: "Is CapturePass useful for real estate brokerages?",
    answer:
      "Yes. Individual agents and brokerages can use CapturePass to create a more consistent, professional, and relationship-focused experience."
  },
  {
    question: "Does CapturePass replace a real estate CRM?",
    answer:
      "No. CapturePass complements existing systems by helping agents capture more face-to-face and referral opportunities."
  }
] as const;

const organizationSchema = buildOrganizationJsonLd();
const faqSchema = buildFaqJsonLd(faqItems.map((item) => ({ question: item.question, answer: item.answer })));
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CapturePass",
  description:
    "CapturePass is a contact capture and relationship-building platform for real estate professionals.",
  brand: {
    "@type": "Brand",
    name: "CapturePass"
  },
  category: "Contact capture and relationship-building platform",
  url: canonicalUrl
};

function renderParagraphs(lines: string[]) {
  return lines.map((line) => (
    <p key={line} style={bodyCopyStyle}>
      {line}
    </p>
  ));
}

function renderBullets(lines: string[]) {
  return lines.map((line) => (
    <div key={line} style={bulletItemStyle}>
      {line}
    </div>
  ));
}

export default function BestDigitalBusinessCardForRealEstateAgentsPage() {
  return (
    <Shell
      footerLeft="Real Estate"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact", label: "Contact" },
        { href: "/real-estate-agents", label: "Real Estate Agents" },
        { href: "/best-digital-business-card-for-sales-teams", label: "Sales Teams" },
        { href: "/best-digital-business-card-for-insurance-agents", label: "Insurance Agents" },
        { href: "/capturepass-vs-popl", label: "CapturePass vs Popl" }
      ]}
    >
      <JsonLd data={organizationSchema} />
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={heroStyle}>
        <h1 style={heroHeading}>The Best Contact Capture Platform For Real Estate Agents</h1>
        <h2 style={heroSubheading}>Because Real Estate Is A Relationship Business</h2>
        <div style={heroCopyWrap}>{renderParagraphs(heroCopy)}</div>
        <div style={heroActions}>
          <Link className="button primary" href="/contact">
            Request a Demo
          </Link>
          <Link className="button secondary" href="/business/pricing">
            View Business Pricing
          </Link>
        </div>
      </section>

      <section className="section-wrap">
        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Real Estate Agents Meet Opportunities Everywhere</h2>
          {renderParagraphs(opportunityCopy.slice(0, 2))}
          <div style={bulletGrid}>{renderBullets(opportunityCopy.slice(2, 11))}</div>
          {renderParagraphs(opportunityCopy.slice(11))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>What Real Estate Agents Actually Need</h2>
          <div className="admin-table-frame business-member-table" style={tableFrameStyle}>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="Real estate needs and why they matter">
                <thead>
                  <tr>
                    <th>Real Estate Need</th>
                    <th>Why It Matters</th>
                  </tr>
                </thead>
                <tbody>
                  {needRows.map((row) => (
                    <tr key={row.need}>
                      <td>{row.need}</td>
                      <td>{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Open Houses Need Better Follow-Up</h2>
          {renderParagraphs(openHouseCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Referrals Drive Real Estate Growth</h2>
          {renderParagraphs(referralCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Contact Capture Matters More Than Contact Sharing</h2>
          {renderParagraphs(captureCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>The Brokerage Perspective</h2>
          {renderParagraphs(brokerageCopy.slice(0, 2))}
          <div style={bulletGrid}>{renderBullets(brokerageCopy.slice(2, 7))}</div>
          {renderParagraphs(brokerageCopy.slice(7))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Why Real Estate Agents Choose CapturePass</h2>
          {renderParagraphs(chooseCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Frequently Asked Questions</h2>
          <div style={faqGrid}>
            {faqItems.map((item) => (
              <details key={item.question} style={faqItemStyle}>
                <summary style={faqSummaryStyle}>{item.question}</summary>
                <p style={faqAnswerStyle}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Ready To Turn More Real Estate Conversations Into Clients?</h2>
          {renderParagraphs([
            "Real estate is built on trust.",
            "Trust is built through relationships.",
            "CapturePass helps real estate professionals capture more opportunities, strengthen referrals, and stay easier to remember.",
            "Request a demo and see how modern real estate agents and brokerages are using CapturePass today."
          ])}
          <div style={heroActions}>
            <Link className="button primary" href="/contact">
              Request a Demo
            </Link>
            <Link className="button secondary" href="/business/pricing">
              View Business Pricing
            </Link>
          </div>
        </section>
      </section>
    </Shell>
  );
}

const heroStyle = {
  paddingBottom: 36
} satisfies CSSProperties;

const heroHeading = {
  maxWidth: 980,
  margin: "28px auto 14px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(54px, 7vw, 92px)",
  lineHeight: 0.94,
  letterSpacing: "-0.045em",
  fontWeight: 800
} satisfies CSSProperties;

const heroSubheading = {
  maxWidth: 980,
  margin: "0 auto 18px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(30px, 4.4vw, 56px)",
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  fontWeight: 800
} satisfies CSSProperties;

const heroCopyWrap = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 14
} satisfies CSSProperties;

const heroActions = {
  maxWidth: 980,
  margin: "28px auto 0",
  display: "flex",
  flexWrap: "wrap",
  gap: 12
} satisfies CSSProperties;

const sectionCard = {
  padding: "clamp(24px, 5vw, 36px)"
} satisfies CSSProperties;

const sectionHeading = {
  margin: "0 0 18px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  fontWeight: 800
} satisfies CSSProperties;

const tableFrameStyle = {
  marginTop: 20
} satisfies CSSProperties;

const bulletGrid = {
  display: "grid",
  gap: 12,
  margin: "8px 0 4px"
} satisfies CSSProperties;

const bodyCopyStyle = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.62,
  fontWeight: 500
} satisfies CSSProperties;

const bulletItemStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  background: "rgba(255,255,255,0.03)",
  padding: "14px 16px",
  color: "#f3f5f7",
  fontSize: 15,
  lineHeight: 1.5,
  fontWeight: 600
} satisfies CSSProperties;

const faqGrid = {
  display: "grid",
  gap: 14
} satisfies CSSProperties;

const faqItemStyle = {
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 20,
  background: "rgba(10, 13, 20, 0.72)",
  padding: "18px 20px"
} satisfies CSSProperties;

const faqSummaryStyle = {
  cursor: "pointer",
  fontWeight: 700,
  color: "#f3f5f7",
  listStyle: "none"
} satisfies CSSProperties;

const faqAnswerStyle = {
  margin: "12px 0 0",
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.62,
  fontWeight: 500
} satisfies CSSProperties;
