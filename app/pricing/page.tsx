import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqJsonLd, buildPageMetadata, buildSoftwareApplicationJsonLd, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "Compare CapturePass individual plans, upgrade for contact capture and analytics, and move into business pricing when you need team tools.",
  path: "/pricing",
  title: "Pricing"
});

const individualPlans = [
  {
    name: "Digital",
    price: "$1.99",
    cadence: "/ month",
    purpose: "Create a digital CapturePass profile, capture contacts, and start sharing with your link or QR code.",
    cta: "Start Capturing Contacts",
    href: "/api/checkout?plan=digital",
    features: [
      "Active CapturePass profile",
      "Digital pass only",
      "QR sharing",
      "Profile link sharing",
      "Add-to-contacts / vCard saving",
      "Basic profile customization",
      "No physical card included"
    ]
  },
  {
    name: "Core",
    price: "$29",
    cadence: "/ year",
    purpose: "Activate your CapturePass profile, get your physical NFC card, and start capturing contacts instantly with an introductory annual offer.",
    cta: "Start Capturing Contacts",
    href: "/api/checkout?plan=core",
    featured: true,
    features: [
      "Active CapturePass profile",
      "1 physical CapturePass NFC card",
      "NFC sharing",
      "QR sharing",
      "Profile link sharing",
      "Add-to-contacts / vCard saving",
      "Basic profile customization",
      "Themes",
      "Introductory offer"
    ]
  },
  {
    name: "Capture+",
    price: "$79",
    cadence: "/ year",
    purpose: "For people who share often and want contact capture, better branding, analytics, and more control.",
    cta: "Upgrade to Capture+",
    href: "/api/checkout?plan=tagg_plus",
    features: [
      "Everything in Core",
      "Contact Capture",
      "Contacts dashboard",
      "Individual contact downloads",
      "Analytics dashboard",
      "Views and unique visitors",
      "QR, NFC, and source tracking",
      "Button click analytics",
      "Contact analytics",
      "Advanced customization",
      "Custom buttons",
      "Priority support"
    ]
  }
];

const faqItems = [
  {
    question: "Can I build a profile before buying?",
    answer:
      "Yes. The free profile lets you claim a handle, build your CapturePass profile, add basic links, and preview your page before activation."
  },
  {
    question: "How long is my username reserved?",
    answer:
      "Your handle is reserved for 14 days. We send reminder emails before the reservation expires."
  },
  {
    question: "Do I need a physical card?",
    answer:
      "No. You can start by building your profile and sharing a QR or link after activation. The card makes real-world sharing faster."
  },
  {
    question: "Can businesses use branded CapturePass systems?",
    answer:
      "Yes. Business plans can include company-branded cards, profile pages, shared templates, review links, and team controls."
  },
  {
    question: "Can profiles be deactivated or reassigned?",
    answer:
      "Yes. Team systems can support employee activation, deactivation, card reassignment, and new hire or replacement card management."
  },
  {
    question: "Do you sell user data or usage patterns?",
    answer:
      "No. CapturePass is built for sharing, not tracking. We do not sell your personal data or usage patterns."
  }
];

const faqSchema = buildFaqJsonLd(faqItems);
const softwareApplicationSchema = buildSoftwareApplicationJsonLd({
  description: SITE_DESCRIPTION,
  name: "CapturePass",
  path: "/pricing"
});

function checkoutNoticeFor(value?: string | null) {
  switch (value) {
    case "choose-plan":
      return "Choose Digital, Core, or Capture+ to start checkout.";
    case "unavailable":
      return "Checkout is temporarily unavailable. Please try again in a few minutes.";
    case "start-error":
      return "We could not start checkout just now. Please choose a plan and try again.";
    default:
      return null;
  }
}

export default async function PricingPage({
  searchParams
}: {
  searchParams?: Promise<{
    checkout?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const checkoutNoticeText = checkoutNoticeFor(params.checkout);

  return (
    <Shell
      footerLeft="Contact Capture Platform"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Pricing</span>
        </div>

        <h1 style={heroHeading}>Choose the CapturePass plan that fits how you share.</h1>

        <p style={heroCopy}>
          Start digital, add a physical card, or upgrade for contact capture, analytics, and deeper customization.
        </p>

        {checkoutNoticeText ? (
          <div style={checkoutNotice}>
            {checkoutNoticeText}
          </div>
        ) : null}

        <div style={trustLine}>Contact capture first. Digital business cards included.</div>
      </section>

      <section className="section-wrap">
        <div style={pricingGrid}>
          {individualPlans.map((plan) => (
            <article
              className="card tagg-card"
              key={plan.name}
              style={plan.featured ? { ...planCard, ...featuredPlanCard } : planCard}
            >
              {plan.featured ? <div style={planBadge}>Most direct</div> : null}

              <div style={planName}>{plan.name}</div>

              <div style={priceRow}>
                <span style={price}>{plan.price}</span>
                {plan.cadence ? <span style={cadence}>{plan.cadence}</span> : null}
              </div>

              <p style={planPurpose}>{plan.purpose}</p>

              <div style={featureList}>
                {plan.features.map((feature) => (
                  <div key={feature} style={featureItem}>
                    {feature}
                  </div>
                ))}
              </div>

              <Link className="button primary" href={plan.href} style={{ marginTop: "auto" }}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <section className="card tagg-card tagg-card-feature" style={businessPanel}>
          <div className="kicker" style={{ width: "fit-content" }}>
            <span className="mini-star">✦</span>
            <span>Business</span>
          </div>
          <h2 style={sectionHeading}>Need team pricing?</h2>
          <p style={sectionCopy}>
            Business pricing now lives on its own page with Small Team, Starter, Growth, and Pro options for teams that need shared branding, reusable seats, employee management, lead ownership, analytics, and CRM readiness.
          </p>
          <Link className="button primary" href="/business/pricing" style={{ width: "fit-content" }}>
            View Business Pricing
          </Link>
        </section>

        <section className="card tagg-card" style={internalLinkPanel}>
          <div className="kicker" style={{ width: "fit-content" }}>
            <span className="mini-star">✦</span>
            <span>Explore More</span>
          </div>
          <h2 style={sectionHeading}>Need a page for a specific use case?</h2>
          <p style={sectionCopy}>
            Visit the industry landing pages for dealerships, real estate agents, insurance agents,
            sales teams, and NFC contact capture cards.
          </p>
          <div style={internalLinkGrid}>
            <Link className="button secondary" href="/dealerships">
              Dealerships
            </Link>
            <Link className="button secondary" href="/real-estate-agents">
              Real Estate Agents
            </Link>
            <Link className="button secondary" href="/insurance-agents">
              Insurance Agents
            </Link>
            <Link className="button secondary" href="/sales-teams">
              Sales Teams
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              Contact Capture NFC Cards
            </Link>
          </div>
        </section>

        <section className="card tagg-card" style={internalLinkPanel}>
          <div className="kicker" style={{ width: "fit-content" }}>
            <span className="mini-star">✦</span>
            <span>Springfield</span>
          </div>
          <h2 style={sectionHeading}>Looking for CapturePass in Springfield, Illinois?</h2>
          <p style={sectionCopy}>
            Explore local SEO pages that map CapturePass to contact capture first, with NFC business cards and digital business cards supporting the SEO surface.
          </p>
          <div style={internalLinkGrid}>
            <Link className="button secondary" href="/springfield-il-nfc-business-cards">
              NFC Business Cards
            </Link>
            <Link className="button secondary" href="/springfield-il-digital-business-cards">
              Digital Business Cards
            </Link>
            <Link className="button secondary" href="/springfield-il-sales-team-business-cards">
              Sales Team Cards
            </Link>
          </div>
        </section>

        <section style={faqSection}>
          <div style={{ textAlign: "center" }}>
            <div className="kicker" style={{ margin: "0 auto 14px" }}>
              <span className="mini-star">✦</span>
              <span>FAQ</span>
            </div>
            <h2 style={sectionHeading}>Quick Answers</h2>
          </div>

          <div style={faqGrid}>
            {faqItems.map((item) => (
              <div className="card" key={item.question} style={faqCard}>
                <h3 style={faqQuestion}>{item.question}</h3>
                <p style={faqAnswer}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </Shell>
  );
}

const heroHeading = {
  maxWidth: 980,
  margin: "28px auto 18px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(56px, 7vw, 96px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const heroCopy = {
  maxWidth: 760,
  margin: "0 auto",
  color: "#b6bcc8",
  fontSize: "clamp(18px, 2vw, 21px)",
  lineHeight: 1.6,
  fontWeight: 500
};

const trustLine = {
  width: "fit-content",
  margin: "22px auto 0",
  padding: "9px 13px",
  borderRadius: 999,
  border: "1px solid rgba(var(--brand-deep-rgb),.28)",
  background: "rgba(var(--brand-primary-rgb),.08)",
  color: "var(--brand-gold)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em"
};

const checkoutNotice = {
  width: "fit-content",
  maxWidth: "min(100%, 680px)",
  margin: "20px auto 0",
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid rgba(var(--brand-deep-rgb),.34)",
  background: "rgba(var(--brand-primary-rgb),.12)",
  color: "var(--brand-white)",
  fontSize: 15,
  lineHeight: 1.35,
  fontWeight: 800
};

const pricingGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))",
  gap: 18
};

const planCard = {
  position: "relative" as const,
  display: "grid",
  gap: 16,
  padding: 26,
  minHeight: 590
};

const featuredPlanCard = {
  borderColor: "rgba(var(--brand-primary-rgb),.52)",
  background:
    "radial-gradient(360px 160px at 50% 0%, rgba(var(--brand-primary-rgb),.18), transparent 72%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.014)), rgba(12,12,15,.74)"
};

const planBadge = {
  position: "absolute" as const,
  top: 16,
  right: 16,
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid rgba(var(--brand-primary-rgb),.36)",
  background: "rgba(var(--brand-primary-rgb),.16)",
  color: "var(--brand-gold)",
  fontSize: 12,
  fontWeight: 800
};

const planName = {
  color: "var(--brand-gold)",
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const
};

const priceRow = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  flexWrap: "wrap" as const
};

const price = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(42px, 5vw, 56px)",
  lineHeight: 0.94,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const cadence = {
  color: "#b6bcc8",
  fontSize: 16,
  fontWeight: 600
};

const planPurpose = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 15,
  lineHeight: 1.55,
  fontWeight: 500
};

const featureList = {
  display: "grid",
  gap: 9
};

const featureItem = {
  paddingLeft: 14,
  borderLeft: "2px solid rgba(var(--brand-primary-rgb),.42)",
  color: "#e5e7eb",
  fontSize: 14,
  lineHeight: 1.4,
  fontWeight: 600
};

const businessPanel = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 24,
  padding: "clamp(24px, 5vw, 36px)",
  background:
    "radial-gradient(520px 240px at 18% 0%, rgba(var(--brand-primary-rgb),.18), transparent 62%), radial-gradient(420px 220px at 92% 12%, rgba(var(--brand-deep-rgb),.13), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(8,8,10,.96), rgba(4,4,6,.98))"
};

const internalLinkPanel = {
  display: "grid",
  gap: 16,
  padding: "clamp(24px, 5vw, 36px)",
  marginTop: 18
};

const internalLinkGrid = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12
};

const sectionHeading = {
  margin: "0 0 12px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const sectionCopy = {
  margin: 0,
  maxWidth: 760,
  color: "#b6bcc8",
  fontSize: 18,
  lineHeight: 1.6,
  fontWeight: 500
};

const businessIntro = {
  margin: 0,
  color: "#e5e7eb",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 600
};

const businessQuoteCard = {
  display: "grid",
  gap: 12,
  alignContent: "start",
  padding: 22,
  borderRadius: 20,
  border: "1px solid rgba(var(--brand-deep-rgb),.28)",
  background: "rgba(var(--brand-primary-rgb),.08)"
};

const managementCopyGrid = {
  display: "grid",
  gap: 14
};

const businessTierGrid = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 16
};

const businessTierCard = {
  display: "grid",
  gap: 18,
  padding: 22,
  borderRadius: 22,
  border: "1px solid rgba(var(--brand-deep-rgb),.28)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.018)), rgba(8,8,10,.72)"
};

const businessTierDetails = {
  display: "grid",
  gap: 8,
  color: "#e5e7eb",
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 700
};

const businessPlanOptions = {
  display: "grid",
  gap: 10
};

const businessPlanOption = {
  display: "grid",
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.026)"
};

const quoteLabel = {
  color: "var(--brand-gold)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const quotePrice = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(28px, 4vw, 38px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const quoteCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 14,
  lineHeight: 1.55
};

const businessFeatureGrid = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10
};

const businessFeature = {
  minHeight: 46,
  display: "flex",
  alignItems: "center",
  padding: "11px 13px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.026)",
  color: "#e5e7eb",
  fontSize: 14,
  fontWeight: 600
};

const faqSection = {
  marginTop: 22,
  display: "grid",
  gap: 18
};

const faqGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 14
};

const faqCard = {
  padding: 22
};

const faqQuestion = {
  margin: "0 0 9px",
  fontFamily: "var(--font-heading)",
  fontSize: 22,
  lineHeight: 1.05,
  letterSpacing: "-0.025em",
  fontWeight: 800
};

const faqAnswer = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 15,
  lineHeight: 1.6
};
