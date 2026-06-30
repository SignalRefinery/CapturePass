import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";

const canonicalUrl = "https://capturepass.com/best-digital-business-card-for-insurance-agents";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See why insurance agents use CapturePass to capture leads, strengthen referral relationships, improve follow-up, and maintain long-term client connections with NFC business cards and mobile QR codes.",
  path: "/best-digital-business-card-for-insurance-agents",
  title: "Best Contact Capture Platform For Insurance Agents | CapturePass"
});

const openGraph = metadata.openGraph;
const twitter = metadata.twitter;

const heroCopy = [
  "Insurance agents do not sell one-time transactions.",
  "They build long-term relationships.",
  "A policy sold today may remain with an agency for years.",
  "A referral received today may become a client next month.",
  "A networking conversation today may turn into a future policyholder.",
  "That is why insurance professionals need more than a business card.",
  "They need a better way to build and maintain relationships.",
  "CapturePass was designed around that idea."
];

const opportunityCopy = [
  "Insurance professionals generate business in many different ways.",
  "Networking groups.",
  "Community events.",
  "Referral partners.",
  "Mortgage lenders.",
  "Real estate agents.",
  "Dealerships.",
  "Existing policyholders.",
  "Friends and family referrals.",
  "Local businesses.",
  "Every conversation has potential value.",
  "The challenge is not creating conversations.",
  "The challenge is maintaining them.",
  "Many opportunities disappear because there is no structured follow-up process.",
  "Contact information gets lost.",
  "Business cards get misplaced.",
  "A prospect intends to call later but never does.",
  "Relationships that could have generated business simply fade away."
];

const needRows = [
  { need: "Instant contact sharing", why: "Make it easy for prospects to save your information." },
  { need: "Contact capture", why: "Turn networking conversations into future opportunities." },
  {
    need: "Referral partner connections",
    why: "Stay connected with real estate agents, lenders, dealers, and business owners."
  },
  { need: "Agency branding", why: "Present a professional, consistent experience." },
  { need: "Team visibility", why: "Help agency owners understand adoption and engagement." },
  { need: "Follow-up opportunities", why: "Create reasons to continue conversations." },
  { need: "Relationship retention", why: "Maintain long-term connections with prospects and clients." }
] as const;

const referralCopy = [
  "Many insurance agencies grow through referrals.",
  "A satisfied client introduces a friend.",
  "A realtor sends a homebuyer.",
  "A lender recommends an agent.",
  "A business owner shares a contact.",
  "Those referrals are valuable.",
  "But only if they are captured.",
  "The easier it is to exchange information and continue the conversation, the more likely that referral becomes a client.",
  "That is why contact capture matters."
];

const captureCopy = [
  "Most contact-sharing platforms focus on helping agents share information.",
  "That is useful.",
  "But sharing information is only half the equation.",
  "Capturing information creates opportunity.",
  "If a prospect saves your information, that is good.",
  "If you also receive their information, that is better.",
  "Now there is a reason to follow up.",
  "Now there is a relationship to build.",
  "Now there is an opportunity to track.",
  "That is a meaningful difference."
];

const agencyCopy = [
  "Agency owners often think differently than individual producers.",
  "They care about:",
  "Team adoption",
  "Consistency",
  "Branding",
  "Relationship retention",
  "Long-term growth",
  "They need tools that can support multiple producers while maintaining a professional customer experience.",
  "That is why many agencies look beyond simple contact-sharing tools and evaluate broader relationship-building tools."
];

const chooseCopy = [
  "Insurance professionals choose CapturePass because it aligns with how insurance relationships actually work.",
  "Not just sharing information.",
  "Not just replacing paper cards.",
  "Building connections.",
  "Maintaining visibility.",
  "Supporting referrals.",
  "Creating opportunities for follow-up.",
  "Helping conversations become clients.",
  "That is why CapturePass is more than a contact-sharing tool.",
  "It is a relationship-building tool."
];

const faqItems = [
  {
    question: "Are contact capture platforms useful for insurance agents?",
    answer:
      "Yes. They make it easier to share information, maintain professional branding, and support networking and referral activities."
  },
  {
    question: "Can contact capture platforms help insurance agents generate referrals?",
    answer:
      "They can make referral exchanges easier and help agents maintain connections with referral partners."
  },
  {
    question: "Does CapturePass support contact capture?",
    answer:
      "Yes. CapturePass includes contact capture functionality designed to help agents collect prospect information and support follow-up."
  },
  {
    question: "Is CapturePass useful for insurance agencies?",
    answer:
      "Yes. Both individual agents and larger agencies can use CapturePass to create a more consistent and professional experience."
  },
  {
    question: "Does CapturePass replace an insurance CRM?",
    answer:
      "No. CapturePass complements existing systems by helping agents capture and maintain more opportunities."
  }
] as const;

const organizationSchema = buildOrganizationJsonLd();
const faqSchema = buildFaqJsonLd(faqItems.map((item) => ({ question: item.question, answer: item.answer })));
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CapturePass",
  description:
    "CapturePass is a contact capture and relationship-building platform for insurance agents.",
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

export default function BestDigitalBusinessCardForInsuranceAgentsPage() {
  return (
    <Shell
      footerLeft="Insurance"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact", label: "Contact" },
        { href: "/insurance-agents", label: "Insurance Agents" },
        { href: "/best-digital-business-card-for-sales-teams", label: "Sales Teams" },
        { href: "/capturepass-vs-popl", label: "CapturePass vs Popl" }
      ]}
    >
      <JsonLd data={organizationSchema} />
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={heroStyle}>
        <h1 style={heroHeading}>The Best Contact Capture Platform For Insurance Agents</h1>
        <h2 style={heroSubheading}>Because Insurance Is Built On Relationships</h2>
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
          <h2 style={sectionHeading}>Insurance Agents Meet Opportunities Everywhere</h2>
          {renderParagraphs(opportunityCopy.slice(0, 2))}
          <div style={bulletGrid}>{renderBullets(opportunityCopy.slice(2, 10))}</div>
          {renderParagraphs(opportunityCopy.slice(10))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>What Insurance Agents Actually Need</h2>
          <div className="admin-table-frame business-member-table" style={tableFrameStyle}>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="Insurance needs and why they matter">
                <thead>
                  <tr>
                    <th>Insurance Need</th>
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
          <h2 style={sectionHeading}>Referrals Drive Insurance Growth</h2>
          {renderParagraphs(referralCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Contact Capture Matters More Than Contact Sharing</h2>
          {renderParagraphs(captureCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>The Agency Perspective</h2>
          {renderParagraphs(agencyCopy.slice(0, 2))}
          <div style={bulletGrid}>{renderBullets(agencyCopy.slice(2, 7))}</div>
          {renderParagraphs(agencyCopy.slice(7))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Why Insurance Agents Choose CapturePass</h2>
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
          <h2 style={sectionHeading}>Ready To Strengthen More Insurance Relationships?</h2>
          {renderParagraphs([
            "Insurance is built on trust.",
            "Trust is built through relationships.",
            "CapturePass helps insurance professionals create stronger connections, capture more opportunities, and maintain better follow-up.",
            "Request a demo and see how modern insurance agencies are using CapturePass today."
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
