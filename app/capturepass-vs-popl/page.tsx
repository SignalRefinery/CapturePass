import Link from "next/link";
import type { CSSProperties } from "react";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";

const canonicalUrl = "https://capturepass.com/capturepass-vs-popl";

export const metadata = buildPageMetadata({
  description:
    "Compare CapturePass vs Popl for sales teams, dealerships, insurance agencies, real estate brokerages, and growing businesses. Learn the differences in lead capture, team management, analytics, and relationship retention.",
  path: "/capturepass-vs-popl",
  title: "CapturePass vs Popl | Which Digital Business Card Platform Is Better For Sales Teams?"
});

const comparisonRows = [
  { capability: "NFC Cards", taptagg: "Yes", popl: "Yes" },
  { capability: "QR Code Sharing", taptagg: "Yes", popl: "Yes" },
  { capability: "Digital Profiles", taptagg: "Yes", popl: "Yes" },
  { capability: "Contact Capture", taptagg: "Yes", popl: "Yes" },
  { capability: "Team Management", taptagg: "Yes", popl: "Yes" },
  { capability: "Analytics", taptagg: "Yes", popl: "Yes" },
  { capability: "Physical Card Fulfillment", taptagg: "Yes", popl: "Yes" },
  { capability: "CRM Integration & Export Workflows", taptagg: "Yes", popl: "Yes" },
  { capability: "Multi-Location Organizations", taptagg: "Yes", popl: "Yes" },
  { capability: "Dealership-Focused Workflows", taptagg: "Yes", popl: "Not Primary Focus" },
  { capability: "Real Estate Workflows", taptagg: "Yes", popl: "Not Primary Focus" },
  { capability: "Insurance Agency Workflows", taptagg: "Yes", popl: "Not Primary Focus" }
] as const;

const rightForYouRows = [
  { need: "Trade shows and conferences", consider: "Popl" },
  { need: "Event lead capture", consider: "Popl" },
  { need: "Conference networking", consider: "Popl" },
  { need: "Large event marketing teams", consider: "Popl" },
  { need: "Independent professionals", consider: "Either" },
  { need: "Real estate brokerages", consider: "CapturePass" },
  { need: "Insurance agencies", consider: "CapturePass" },
  { need: "Automotive dealerships", consider: "CapturePass" },
  { need: "Small business sales teams", consider: "CapturePass" },
  { need: "Multi-location service businesses", consider: "CapturePass" }
] as const;

const faqItems = [
  {
    question: "Is CapturePass cheaper than Popl?",
    answer:
      "Pricing depends on deployment size and required functionality. Businesses should evaluate total value, team management capabilities, lead capture workflows, and operational needs rather than price alone."
  },
  {
    question: "Does CapturePass support contact capture?",
    answer:
      "Yes. CapturePass includes contact capture functionality designed to help businesses collect prospect information and maintain records of customer interactions."
  },
  {
    question: "Can CapturePass manage sales teams?",
    answer: "Yes. Business plans include team-oriented functionality, analytics, and employee management capabilities."
  },
  {
    question: "Is CapturePass better for dealerships?",
    answer:
      "Dealerships are one of the industries CapturePass was specifically designed to support. Features such as team management, lead capture, employee assignment, and multi-location support align closely with dealership workflows."
  },
  {
    question: "Is CapturePass a Popl alternative?",
    answer:
      "Yes. Many businesses evaluating Popl also evaluate CapturePass when they want a platform focused on sales organizations, relationship management, and business growth."
  }
] as const;

const faqSchema = buildFaqJsonLd([...faqItems]);
const organizationSchema = buildOrganizationJsonLd();
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CapturePass",
  description:
    "CapturePass is a digital business card and lead capture platform for sales teams, dealerships, insurance agencies, real estate brokerages, and growing businesses.",
  brand: {
    "@type": "Brand",
    name: "CapturePass"
  },
  category: "Digital business card and lead capture platform",
  url: canonicalUrl
};

export default function CapturePassVsPoplPage() {
  return (
    <Shell
      footerLeft="CapturePass vs Popl"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" }
      ]}
    >
      <JsonLd data={organizationSchema} />
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={{ paddingBottom: 34 }}>
        <h1
          style={{
            maxWidth: 980,
            margin: "28px auto 14px",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(56px, 7vw, 96px)",
            lineHeight: 0.94,
            letterSpacing: "-0.04em",
            fontWeight: 800
          }}
        >
          CapturePass vs Popl
        </h1>

        <h2
          style={{
            maxWidth: 980,
            margin: "0 auto 18px",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(34px, 4.6vw, 62px)",
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            fontWeight: 800
          }}
        >
          Which Digital Business Card Platform Is Better For Sales Teams?
        </h2>

        <div style={heroCopyWrap}>
          <p style={heroCopy}>
            Popl is one of the most recognized names in digital business cards and event lead capture.
            It&apos;s a powerful platform used by organizations around the world to collect contacts at conferences,
            trade shows, and networking events.
          </p>

          <p style={heroCopy}>But most sales organizations aren&apos;t trying to win a trade show.</p>

          <p style={heroCopy}>They&apos;re trying to turn conversations into customers.</p>

          <p style={heroCopy}>
            If your team spends its time meeting prospects in dealerships, real estate offices, insurance agencies,
            networking groups, community events, and face-to-face sales appointments, the question becomes much bigger
            than sharing contact information.
          </p>

          <p style={heroCopy}>The real question is:</p>

          <p style={heroCopy}>What happens after the tap?</p>

          <p style={heroCopy}>CapturePass was built around that question.</p>

          <p style={heroCopy}>
            Instead of focusing solely on digital business card sharing, CapturePass helps organizations capture opportunities,
            retain customer relationships, measure engagement, and maintain visibility across their sales team.
          </p>

          <p style={heroCopy}>
            Compare CapturePass and Popl side by side to determine which platform is the best fit for your business.
          </p>
        </div>

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
        <section className="card tagg-card" style={panelStyle}>
          <div className="dashboard-kicker">Quick Comparison</div>
          <p style={sectionIntro}>
            Both CapturePass and Popl provide many of the core capabilities businesses expect from a modern digital business card platform.
          </p>
          <p style={sectionIntro}>
            If all you need is a digital business card, either platform may meet your needs.
          </p>
          <p style={sectionIntro}>
            The differences become clearer when you look at who the platform was designed to serve and what business outcomes it is trying to help organizations achieve.
          </p>

          <div className="admin-table-frame business-member-table" style={{ marginTop: 20 }}>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="CapturePass versus Popl quick comparison">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>CapturePass</th>
                    <th>Popl</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.capability}>
                      <td>{row.capability}</td>
                      <td>{row.taptagg}</td>
                      <td>{row.popl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card tagg-card" style={panelStyle}>
          <h2 style={sectionHeading}>What Popl Does Extremely Well</h2>

          <p style={sectionIntro}>Popl has earned its reputation for a reason.</p>

          <p style={sectionIntro}>
            The platform is particularly strong for organizations that:
          </p>

          <div style={bulletGrid}>
            {[
              "Attend conferences",
              "Exhibit at trade shows",
              "Run event marketing programs",
              "Need badge scanning functionality",
              "Require extensive CRM integrations",
              "Manage large enterprise deployments"
            ].map((item) => (
              <div className="business-list-item" key={item}>
                {item}
              </div>
            ))}
          </div>

          <p style={sectionIntro}>
            For many organizations, Popl is one of the first names that comes to mind when evaluating digital business card software.
          </p>

          <p style={sectionIntro}>That recognition is well deserved.</p>
        </section>

        <section className="card tagg-card" style={panelStyle}>
          <h2 style={sectionHeading}>Where CapturePass Takes A Different Approach</h2>

          <h3 style={subsectionHeading}>Built Around Relationships, Not Just Contact Exchange</h3>

          <p style={sectionIntro}>
            Most digital business card platforms focus on one moment:
          </p>

          <p style={sectionIntro}>The moment two people exchange information.</p>

          <p style={sectionIntro}>CapturePass focuses on everything that happens after that moment.</p>

          <p style={sectionIntro}>Because sharing information is easy.</p>

          <p style={sectionIntro}>Maintaining relationships is hard.</p>

          <p style={sectionIntro}>
            That&apos;s why CapturePass was designed to help businesses:
          </p>

          <div style={bulletGrid}>
            {[
              "Capture leads",
              "Track engagement",
              "Measure activity",
              "Maintain relationship continuity",
              "Protect customer connections from employee turnover"
            ].map((item) => (
              <div className="business-list-item" key={item}>
                {item}
              </div>
            ))}
          </div>

          <p style={sectionIntro}>
            The goal isn&apos;t simply to hand someone a digital business card.
          </p>

          <p style={sectionIntro}>
            The goal is to help organizations create a repeatable system for building and maintaining customer relationships.
          </p>

          <h3 style={subsectionHeading}>Designed For Real Businesses</h3>

          <p style={sectionIntro}>Not every company has:</p>

          <div style={bulletGrid}>
            {[
              "Event marketing teams",
              "Sales operations departments",
              "Conference budgets",
              "Dedicated CRM administrators"
            ].map((item) => (
              <div className="business-list-item" key={item}>
                {item}
              </div>
            ))}
          </div>

          <p style={sectionIntro}>Many businesses simply have employees who meet people every day.</p>

          <div style={shortLineGroup}>
            <p style={sectionIntro}>Insurance agents.</p>
            <p style={sectionIntro}>Real estate professionals.</p>
            <p style={sectionIntro}>Dealership salespeople.</p>
            <p style={sectionIntro}>Mortgage lenders.</p>
            <p style={sectionIntro}>Recruiters.</p>
            <p style={sectionIntro}>Financial advisors.</p>
          </div>

          <p style={sectionIntro}>These organizations need something practical.</p>
          <p style={sectionIntro}>Something their team can start using immediately.</p>
          <p style={sectionIntro}>
            Something that helps capture opportunities without creating additional administrative work.
          </p>

          <p style={sectionIntro}>That reality shaped how CapturePass was built.</p>
        </section>

        <section className="card tagg-card" style={panelStyle}>
          <h2 style={sectionHeading}>Which Platform Is Right For You?</h2>

          <div className="admin-table-frame business-member-table" style={{ marginTop: 20 }}>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="CapturePass versus Popl recommendations">
                <thead>
                  <tr>
                    <th>If Your Primary Need Is...</th>
                    <th>Consider</th>
                  </tr>
                </thead>
                <tbody>
                  {rightForYouRows.map((row) => (
                    <tr key={row.need}>
                      <td>{row.need}</td>
                      <td>{row.consider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card tagg-card" style={panelStyle}>
          <h2 style={sectionHeading}>Why Dealerships Choose CapturePass</h2>

          <p style={sectionIntro}>This is where the conversation becomes different.</p>

          <p style={sectionIntro}>Most digital business card companies talk about networking.</p>

          <p style={sectionIntro}>Dealerships don&apos;t have a networking problem.</p>

          <p style={sectionIntro}>They have a relationship retention problem.</p>

          <h3 style={subsectionHeading}>Salesperson Turnover</h3>

          <p style={sectionIntro}>Dealerships experience turnover.</p>

          <p style={sectionIntro}>That&apos;s reality.</p>

          <p style={sectionIntro}>When a salesperson leaves, what happens to the relationships they built?</p>

          <p style={sectionIntro}>What happens to the customers they&apos;ve worked with for years?</p>

          <p style={sectionIntro}>What happens to the prospects they met last month?</p>

          <p style={sectionIntro}>What happens to future service referrals?</p>

          <p style={sectionIntro}>
            These questions matter far more than whether someone can share a digital profile.
          </p>

          <h3 style={subsectionHeading}>Lead Ownership</h3>

          <p style={sectionIntro}>
            Many dealerships want customer relationships to remain dealership assets rather than individual salesperson assets.
          </p>

          <p style={sectionIntro}>
            CapturePass helps support that objective by giving organizations visibility into how cards are being used and how opportunities are being generated.
          </p>

          <h3 style={subsectionHeading}>Multi-Rooftop Operations</h3>

          <p style={sectionIntro}>
            Dealer groups often manage multiple locations.
          </p>

          <p style={sectionIntro}>
            CapturePass supports location-based management that helps organizations maintain visibility while preserving a consistent customer experience.
          </p>

          <h3 style={subsectionHeading}>Employee Reassignment</h3>

          <p style={sectionIntro}>
            When staffing changes occur, organizations need flexibility.
          </p>

          <p style={sectionIntro}>
            The ability to reassign resources and maintain continuity becomes increasingly important as teams grow.
          </p>

          <p style={sectionIntro}>
            These are business challenges that rarely appear on digital business card comparison pages.
          </p>

          <p style={sectionIntro}>
            Yet they&apos;re often the exact issues business owners care about most.
          </p>
        </section>

        <section className="card tagg-card" style={panelStyle}>
          <h2 style={sectionHeading}>Which Platform Is Better?</h2>

          <p style={sectionIntro}>
            If your primary use case is event marketing, conference lead capture, and enterprise trade-show workflows, Popl is an excellent option.
          </p>

          <p style={sectionIntro}>
            If your primary goal is helping your team capture opportunities, build relationships, retain customer connections, and create measurable business outcomes, CapturePass was built specifically with those objectives in mind.
          </p>

          <p style={sectionIntro}>The best platform depends on the problem you&apos;re trying to solve.</p>

          <p style={sectionIntro}>
            But if your organization views every handshake as a potential opportunity, CapturePass deserves a serious look.
          </p>
        </section>

        <section className="card tagg-card" style={panelStyle}>
          <div style={{ textAlign: "center" }}>
            <h2 style={sectionHeading}>Frequently Asked Questions</h2>
          </div>

          <div style={faqGrid}>
            {faqItems.map((item) => (
              <article className="card" key={item.question} style={faqCard}>
                <h3 style={faqQuestion}>{item.question}</h3>
                <p style={faqAnswer}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card tagg-card tagg-card-feature" style={finalCtaPanel}>
          <h2 style={finalHeading}>Ready To Turn Every Handshake Into A Prospect?</h2>

          <p style={finalCopy}>Digital business cards are easy.</p>

          <p style={finalCopy}>
            Building systems that help your organization capture opportunities and maintain customer relationships is harder.
          </p>

          <p style={finalCopy}>That&apos;s where CapturePass comes in.</p>

          <p style={finalCopy}>
            Request a demo and see how modern sales teams are using CapturePass to create measurable business growth.
          </p>

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

const heroCopyWrap = {
  display: "grid",
  gap: 14,
  maxWidth: 860,
  margin: "0 auto"
};

const heroCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: "clamp(18px, 2vw, 21px)",
  lineHeight: 1.62,
  fontWeight: 500
};

const heroActions: CSSProperties = {
  marginTop: 30,
  display: "flex",
  justifyContent: "center",
  gap: 14,
  flexWrap: "wrap"
};

const panelStyle = {
  padding: "clamp(24px, 4vw, 34px)"
};

const sectionIntro = {
  margin: "0 0 14px",
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.68,
  fontWeight: 500
};

const sectionHeading = {
  margin: "8px 0 18px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(32px, 4vw, 48px)",
  lineHeight: 0.98,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const subsectionHeading = {
  margin: "18px 0 12px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(24px, 3vw, 32px)",
  lineHeight: 1.02,
  letterSpacing: "-0.03em",
  fontWeight: 800
};

const bulletGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  margin: "10px 0 18px"
};

const shortLineGroup = {
  display: "grid",
  gap: 0
};

const faqGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 16,
  marginTop: 20
};

const faqCard = {
  padding: 22
};

const faqQuestion = {
  margin: "0 0 12px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(20px, 2.4vw, 26px)",
  lineHeight: 1.02,
  letterSpacing: "-0.03em",
  fontWeight: 800
};

const faqAnswer = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 15,
  lineHeight: 1.68,
  fontWeight: 500
};

const finalCtaPanel: CSSProperties = {
  padding: "clamp(26px, 4vw, 38px)",
  textAlign: "center"
};

const finalHeading = {
  margin: "16px auto 12px",
  maxWidth: 820,
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(40px, 5vw, 64px)",
  lineHeight: 0.96,
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const finalCopy = {
  margin: "0 auto 14px",
  maxWidth: 760,
  color: "#b6bcc8",
  fontSize: "clamp(16px, 1.8vw, 18px)",
  lineHeight: 1.66,
  fontWeight: 500
};
