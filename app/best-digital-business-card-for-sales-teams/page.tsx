import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";

const canonicalUrl = "https://capturepass.com/best-digital-business-card-for-sales-teams";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See why sales teams choose CapturePass to capture leads, improve follow-up, increase accountability, and turn more conversations into opportunities.",
  path: "/best-digital-business-card-for-sales-teams",
  title: "Best Digital Business Card For Sales Teams | CapturePass"
});

const openGraph = metadata.openGraph;
const twitter = metadata.twitter;

const heroCopy = [
  "Most digital business card platforms focus on one thing:",
  "Sharing information.",
  "That matters.",
  "But sales teams are not measured on how many contacts they share.",
  "They are measured on opportunities created.",
  "Pipeline generated.",
  "Appointments booked.",
  "Relationships maintained.",
  "Revenue closed.",
  "That changes the conversation.",
  "The best digital business card for a sales team is not the one with the prettiest profile.",
  "It is the one that helps create more business.",
  "That is the philosophy behind CapturePass."
];

const realProblemCopy = [
  "Sales organizations rarely struggle with sharing contact information.",
  "Most salespeople already have:",
  "Business cards",
  "Email signatures",
  "LinkedIn profiles",
  "Company websites",
  "Phone numbers",
  "The problem is not sharing information.",
  "The problem is losing opportunities.",
  "Conversations happen every day.",
  "At networking events.",
  "At customer locations.",
  "In waiting rooms.",
  "At community events.",
  "Through referrals.",
  "Over lunch.",
  "During chance encounters.",
  "Many of those conversations never become opportunities.",
  "Not because they lacked potential.",
  "Because nobody captured them.",
  "CapturePass was built to help sales teams reduce that loss."
];

const needRows = [
  { need: "Instant contact sharing", matters: "Make it easy to connect in person." },
  { need: "Contact capture", matters: "Turn conversations into follow-up opportunities." },
  { need: "Team visibility", matters: "Help managers understand activity." },
  { need: "Analytics", matters: "Measure engagement and usage." },
  { need: "Brand consistency", matters: "Present a professional image across the team." },
  { need: "Employee onboarding", matters: "Deploy new team members quickly." },
  { need: "Employee reassignment", matters: "Maintain continuity when staffing changes happen." },
  { need: "Multi-location support", matters: "Support growing organizations." }
] as const;

const costOfLostContactsCopy = [
  "Consider a salesperson who meets:",
  "20 people per week",
  "80 people per month",
  "Nearly 1,000 people per year",
  "Not every conversation is a lead.",
  "Not every lead becomes a customer.",
  "But some do.",
  "The challenge is that many opportunities disappear before follow-up ever happens.",
  "A business card gets misplaced.",
  "A phone number never gets saved.",
  "A conversation gets forgotten.",
  "A prospect intends to reach out later but never does.",
  "Small losses compound.",
  "Over time they become meaningful revenue.",
  "That is why contact capture matters.",
  "Not because every interaction becomes a sale.",
  "Because every interaction has the potential to become one."
];

const captureCopy = [
  "Most digital business card providers focus on helping employees share their information.",
  "That is useful.",
  "But for sales teams, capturing information is often more valuable than sharing it.",
  "If a prospect receives your information, that is good.",
  "If your team also receives the prospect's information, that is better.",
  "Now there is a reason for a follow-up.",
  "Now there is a relationship to build.",
  "Now there is an opportunity to track.",
  "The difference may seem small.",
  "In practice it can be enormous."
];

const accountabilityCopy = [
  "Sales managers need visibility.",
  "Not surveillance.",
  "Visibility.",
  "They need to understand:",
  "Who is using company tools?",
  "Who is creating engagement?",
  "Which locations are active?",
  "Which employees are participating?",
  "Where opportunities are being generated?",
  "The goal is not to monitor every action.",
  "The goal is to create accountability and consistency.",
  "The right platform helps managers understand activity without creating unnecessary friction for employees."
];

const turnoverCopy = [
  "Most organizations eventually experience turnover.",
  "Salespeople leave.",
  "Recruiters leave.",
  "Agents leave.",
  "Account managers leave.",
  "The question is not whether it happens.",
  "The question is whether the organization is prepared when it does.",
  "Paper business cards offer no continuity.",
  "Many digital business card platforms focus primarily on the individual.",
  "Sales organizations often need something broader.",
  "They need visibility.",
  "Consistency.",
  "Administrative control.",
  "Continuity.",
  "Because customer relationships are valuable business assets."
];

const industries = [
  {
    copy: "Dealerships use CapturePass to support lead capture, salesperson accountability, rooftop management, and relationship retention.",
    title: "Automotive Sales"
  },
  {
    copy: "Insurance teams use CapturePass to stay connected with prospects, referral partners, and policyholders while creating better visibility into team activity.",
    title: "Insurance Agencies"
  },
  {
    copy: "Brokerages use CapturePass to help agents share information instantly, capture opportunities, and maintain professional branding.",
    title: "Real Estate Brokerages"
  },
  {
    copy: "Recruiters use CapturePass to connect with candidates, referral partners, and employers while maintaining a more organized follow-up process.",
    title: "Recruiting Teams"
  }
];

const chooseCapturePassCopy = [
  "Sales teams choose CapturePass because it was designed around business outcomes.",
  "Not vanity metrics.",
  "Not profile views alone.",
  "Not simply replacing paper cards.",
  "CapturePass helps organizations:",
  "Capture more opportunities",
  "Improve follow-up",
  "Create accountability",
  "Maintain brand consistency",
  "Support growing teams",
  "Improve visibility",
  "Reduce relationship loss from turnover",
  "Create more measurable sales activity",
  "That is why many organizations view CapturePass as more than a digital business card.",
  "It becomes part of the sales process itself."
];

const fitCopy = [
  "Not every team needs the same solution.",
  "If your goal is simply to replace paper cards with a digital profile, there are many options available.",
  "If your organization wants a platform built around lead capture, accountability, follow-up, visibility, and relationship retention, CapturePass deserves serious consideration.",
  "The best digital business card is the one that helps your team create more business.",
  "That is exactly what CapturePass was built to do."
];

const faqItems = [
  {
    question: "What is the best digital business card for sales teams?",
    answer:
      "The best platform depends on your goals. Sales organizations often benefit from solutions that combine contact sharing, lead capture, analytics, team visibility, and administrative controls."
  },
  {
    question: "Why do sales teams use digital business cards?",
    answer:
      "Digital business cards make it easier to share information, capture contacts, maintain brand consistency, and support follow-up activities."
  },
  {
    question: "Can digital business cards help sales teams generate more leads?",
    answer:
      "They can help create more opportunities by making contact sharing and contact capture easier during in-person interactions."
  },
  {
    question: "Does CapturePass support contact capture?",
    answer:
      "Yes. CapturePass includes contact capture functionality designed to help organizations collect prospect information and support follow-up."
  },
  {
    question: "Can managers see team activity?",
    answer:
      "Business plans include analytics and team management features that help organizations better understand engagement and usage."
  },
  {
    question: "Does CapturePass replace a CRM?",
    answer:
      "No. CapturePass helps capture opportunities and support follow-up. It complements existing CRM processes rather than replacing them."
  },
  {
    question: "Can CapturePass support multiple offices or locations?",
    answer:
      "Yes. CapturePass supports multi-location organizations and growing teams."
  },
  {
    question: "Is CapturePass only for sales teams?",
    answer:
      "No. CapturePass is used by sales teams, dealerships, insurance agencies, real estate professionals, recruiters, and other relationship-driven organizations."
  }
] as const;

const faqSchema = buildFaqJsonLd(faqItems.map((item) => ({ question: item.question, answer: item.answer })));
const organizationSchema = buildOrganizationJsonLd();
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CapturePass",
  description:
    "CapturePass is a digital business card, lead capture, and sales enablement platform for sales teams.",
  brand: {
    "@type": "Brand",
    name: "CapturePass"
  },
  category: "Digital business card, lead capture, and sales enablement platform",
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

export default function BestDigitalBusinessCardForSalesTeamsPage() {
  return (
    <Shell
      footerLeft="Sales Teams"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact", label: "Contact" },
        { href: "/dealerships", label: "Dealerships" },
        { href: "/insurance-agents", label: "Insurance Agents" },
        { href: "/real-estate-agents", label: "Real Estate Agents" },
        { href: "/capturepass-vs-popl", label: "CapturePass vs Popl" },
        { href: "/best-nfc-business-card-for-car-dealerships", label: "Dealership NFC Cards" }
      ]}
    >
      <JsonLd data={organizationSchema} />
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={heroStyle}>
        <h1 style={heroHeading}>The Best Digital Business Card For Sales Teams</h1>
        <h2 style={heroSubheading}>Because Sales Teams Need More Than Contact Sharing</h2>
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
          <h2 style={sectionHeading}>The Real Problem Sales Teams Face</h2>
          {renderParagraphs(realProblemCopy.slice(0, 2))}
          <div style={{ display: "grid", gap: 12, margin: "8px 0 4px" }}>{renderBullets(realProblemCopy.slice(2, 7))}</div>
          {renderParagraphs(realProblemCopy.slice(7))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>What Sales Teams Actually Need</h2>
          <div className="admin-table-frame business-member-table" style={tableFrameStyle}>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="Sales team needs and why they matter">
                <thead>
                  <tr>
                    <th>Sales Team Need</th>
                    <th>Why It Matters</th>
                  </tr>
                </thead>
                <tbody>
                  {needRows.map((row) => (
                    <tr key={row.need}>
                      <td>{row.need}</td>
                      <td>{row.matters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={bodyCopyStyle}>A digital business card should support the sales process.</p>
          <p style={bodyCopyStyle}>Not just replace paper.</p>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>The Cost Of Lost Contacts</h2>
          {renderParagraphs(costOfLostContactsCopy.slice(0, 1))}
          <div style={{ display: "grid", gap: 12, margin: "8px 0 4px" }}>{renderBullets(costOfLostContactsCopy.slice(1, 4))}</div>
          {renderParagraphs(costOfLostContactsCopy.slice(4))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Contact Capture Matters More Than Contact Sharing</h2>
          {renderParagraphs(captureCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Accountability Without Micromanagement</h2>
          {renderParagraphs(accountabilityCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>What Happens When An Employee Leaves?</h2>
          {renderParagraphs(turnoverCopy)}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Why Different Industries Use CapturePass</h2>
          {industries.map((industry) => (
            <div key={industry.title} style={{ marginBottom: 18 }}>
              <h3 style={subsectionHeading}>{industry.title}</h3>
              <p style={bodyCopyStyle}>{industry.copy}</p>
            </div>
          ))}
          {renderParagraphs([
            "The industries may be different.",
            "The underlying challenge is often the same.",
            "Capture more opportunities.",
            "Maintain more relationships.",
            "Create more consistency."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Why Sales Teams Choose CapturePass</h2>
          {renderParagraphs(chooseCapturePassCopy.slice(0, 5))}
          <div style={{ display: "grid", gap: 12, margin: "8px 0 4px" }}>{renderBullets(chooseCapturePassCopy.slice(5, 13))}</div>
          {renderParagraphs(chooseCapturePassCopy.slice(13))}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Is CapturePass The Best Digital Business Card For Every Sales Team?</h2>
          {renderParagraphs(fitCopy)}
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
          <h2 style={sectionHeading}>Ready To Turn More Conversations Into Opportunities?</h2>
          {renderParagraphs([
            "Your team is already meeting people.",
            "The question is whether those conversations become opportunities.",
            "CapturePass helps organizations capture more contacts, improve follow-up, create accountability, and maintain stronger customer relationships.",
            "If your sales team is ready for more than a digital business card, request a demo today."
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

const subsectionHeading = {
  margin: "0 0 10px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(24px, 3vw, 32px)",
  lineHeight: 1,
  letterSpacing: "-0.03em",
  fontWeight: 800
} satisfies CSSProperties;

const tableFrameStyle = {
  marginTop: 20
} satisfies CSSProperties;

const faqGrid = {
  display: "grid",
  gap: 14
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
