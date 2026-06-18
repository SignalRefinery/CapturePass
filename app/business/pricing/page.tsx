import Link from "next/link";
import { BUSINESS_PLANS, type BusinessPlanKey } from "@/lib/business/plans";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shared/shell";
import { BusinessPricingPlans } from "./business-pricing-plans";
import { buildPageMetadata, buildSoftwareApplicationJsonLd, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "Business pricing for CapturePass teams: Small Team, Starter, Growth, and Pro with self-managed and managed options, reusable seats, and launch promotion pricing.",
  path: "/business/pricing",
  title: "Business Pricing"
});

const businessTierKeys = [
  ["business_small_team_self", "business_small_team_managed"],
  ["business_starter_self", "business_starter_managed"],
  ["business_growth_self", "business_growth_managed"],
  ["business_pro_self", "business_pro_managed"]
] as const satisfies readonly [BusinessPlanKey, BusinessPlanKey][];

const selfManagedDescription =
  "Your team manages employee profiles, cards, branding, and updates directly.";

const fullyManagedDescription =
  "CapturePass helps with setup, onboarding, employee changes, card assignment, seat reassignment, and profile updates.";

const businessFeatures = [
  "Customer contact capture",
  "Branded employee profiles",
  "NFC and QR sharing",
  "Business contacts dashboard",
  "Business analytics",
  "Employee activation and deactivation",
  "Card and profile reassignment",
  "CRM-ready lead delivery",
  "Review, booking, menu, and listing links",
  "CSV export and lead ownership tools",
  "Reusable employee seats",
  "Optional managed onboarding and support"
];

const businessOutcomes = [
  {
    copy: "Customers save the right employee instantly.",
    title: "Keep Customers Connected"
  },
  {
    copy: "Turn conversations into contacts and follow-up opportunities.",
    title: "Capture More Opportunities"
  },
  {
    copy: "Reassign cards and profiles without reprinting materials.",
    title: "Protect Against Turnover"
  }
];

const businessTiers = businessTierKeys.map(([selfKey, managedKey]) => {
  const selfPlan = BUSINESS_PLANS[selfKey];
  const managedPlan = BUSINESS_PLANS[managedKey];

  return {
    cards: selfPlan.includedCards,
    managed: {
      annualPrice: managedPlan.annualPrice,
      key: managedPlan.key,
      label: "Managed",
      monthlyPrice: managedPlan.monthlyPrice
    },
    name: selfPlan.name,
    seats: selfPlan.seatLimit,
    self: {
      annualPrice: selfPlan.annualPrice,
      key: selfPlan.key,
      label: "Self-Managed",
      monthlyPrice: selfPlan.monthlyPrice
    },
    setupFee: selfPlan.setupFee,
    tier: selfPlan.tier
  };
});

const softwareApplicationSchema = buildSoftwareApplicationJsonLd({
  description: SITE_DESCRIPTION,
  name: "CapturePass Business Pricing",
  path: "/business/pricing"
});

export default function BusinessPricingPage() {
  return (
    <Shell
      footerLeft="Business Pricing"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "User Pricing" },
        { href: "/business", label: "Business" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <JsonLd data={softwareApplicationSchema} />

      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Business Pricing</span>
        </div>
        <h1 style={heroHeading}>Turn every customer interaction into a saved contact.</h1>
        <p style={heroCopy}>
          Choose a plan that fits your team and give every employee a branded CapturePass profile,
          instant contact sharing, lead capture, and reusable NFC/QR tools that keep customers
          connected after they walk away.
        </p>
        <p style={{ ...heroCopy, marginTop: 14, fontSize: "clamp(15px, 1.6vw, 17px)", color: "var(--brand-gold)" }}>
          Digital business cards are included. CapturePass is the contact capture platform, and the business value
          comes from analytics, CRM readiness, and relationship ownership.
        </p>
        <p style={{ ...heroCopy, marginTop: 14, fontSize: "clamp(15px, 1.6vw, 17px)", color: "var(--brand-gold)" }}>
          Works alongside your existing CRM. No replacement required.
        </p>
        <p style={planClarification}>
          All business plans include the same platform features. Choose the seat count and location support that fits your organization.
        </p>
        <div style={launchPromotion}>
          <div style={launchPromotionLabel}>Limited-Time Launch Promotion</div>
          <p style={launchPromotionBody}>All business plan setup fees are waived through July 31, 2026.</p>
          <strong style={launchPromotionSavings}>Save up to $499 when you start before the launch promotion ends.</strong>
          <span style={launchPromotionNote}>Setup fees waived through July 31, 2026.</span>
        </div>
      </section>

      <section className="section-wrap">
        <section className="card tagg-card tagg-card-feature" style={businessPanel}>
          <div style={{ display: "grid", gap: 16 }}>
            <div className="kicker" style={{ width: "fit-content" }}>
              <span className="mini-star">✦</span>
              <span>Built for Sales Teams</span>
            </div>

            <p style={businessIntro}>
              CapturePass helps teams capture contact information, stay connected with customers,
              and protect valuable relationships when employees join, leave, or change roles.
            </p>
          </div>

          <div style={managementCopyGrid}>
            <div style={businessQuoteCard}>
              <div style={quoteLabel}>Self-Managed</div>
              <p style={quoteCopy}>{selfManagedDescription}</p>
            </div>
            <div style={businessQuoteCard}>
              <div style={quoteLabel}>Managed</div>
              <p style={quoteCopy}>{fullyManagedDescription}</p>
            </div>
          </div>

          <section style={outcomeSection}>
            <div style={outcomeHeader}>
              <div className="kicker" style={{ width: "fit-content" }}>
                <span className="mini-star">✦</span>
                <span>Why teams choose CapturePass</span>
              </div>
              <h2 style={outcomeHeading}>Built around the moments your team cannot afford to lose.</h2>
            </div>

            <div style={outcomeGrid}>
              {businessOutcomes.map((outcome) => (
                <article key={outcome.title} style={outcomeCard}>
                  <h3 style={outcomeTitle}>{outcome.title}</h3>
                  <p style={outcomeCopy}>{outcome.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <BusinessPricingPlans tiers={businessTiers} />

          <div style={businessFeatureGrid}>
            {businessFeatures.map((feature) => (
              <div key={feature} style={businessFeature}>
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="card tagg-card" style={{ padding: "clamp(24px, 5vw, 36px)" }}>
          <div className="dashboard-kicker">Explore vertical pages</div>
          <h2
            style={{
              margin: "8px 0 12px",
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(36px, 5vw, 58px)",
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              fontWeight: 800
            }}
          >
            Match your team to the right landing page.
          </h2>
          <p style={{ margin: 0, color: "#b6bcc8", fontSize: 16, lineHeight: 1.62, fontWeight: 500 }}>
            Visit the industry pages for dealerships, real estate agents, insurance agents, sales teams,
            and contact capture NFC cards.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
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

        <section className="card tagg-card" style={{ padding: "clamp(24px, 5vw, 36px)" }}>
          <div className="dashboard-kicker">Resources</div>
          <h2
            style={{
              margin: "8px 0 12px",
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(36px, 5vw, 58px)",
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              fontWeight: 800
            }}
          >
            Explore the playbook behind the rollout.
          </h2>
          <p style={{ margin: 0, color: "#b6bcc8", fontSize: 16, lineHeight: 1.62, fontWeight: 500 }}>
            CapturePass resources explain the workflows behind contact capture, NFC business cards, and industry-specific use cases.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <Link className="button secondary" href="/resources">
              Resource Center
            </Link>
            <Link className="button secondary" href="/resources/category/sales">
              Sales Resources
            </Link>
            <Link className="button secondary" href="/resources/category/dealerships">
              Dealership Resources
            </Link>
            <Link className="button secondary" href="/springfield-il-contact-capture">
              Springfield Contact Capture
            </Link>
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
  fontSize: "clamp(52px, 7vw, 92px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const heroCopy = {
  maxWidth: 780,
  margin: "0 auto",
  color: "#b6bcc8",
  fontSize: "clamp(18px, 2vw, 21px)",
  lineHeight: 1.6,
  fontWeight: 500
};

const planClarification = {
  maxWidth: 820,
  margin: "22px auto 0",
  padding: "16px 18px",
  borderRadius: 18,
  border: "1px solid rgba(var(--brand-deep-rgb),.3)",
  background: "rgba(var(--brand-primary-rgb),.1)",
  color: "#ffffff",
  fontSize: "clamp(16px, 1.8vw, 19px)",
  lineHeight: 1.5,
  fontWeight: 800
};

const launchPromotion = {
  maxWidth: 820,
  margin: "18px auto 0",
  display: "grid",
  gap: 8,
  padding: "18px 20px",
  borderRadius: 22,
  border: "1px solid rgba(34,197,94,.32)",
  background:
    "radial-gradient(320px 140px at 18% 0%, rgba(34,197,94,.18), transparent 72%), linear-gradient(135deg, rgba(34,197,94,.12), rgba(var(--brand-primary-rgb),.1))",
  color: "#ffffff",
  boxShadow: "0 22px 54px rgba(0,0,0,.28)"
};

const launchPromotionLabel = {
  color: "#86efac",
  fontSize: 13,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const launchPromotionBody = {
  margin: 0,
  color: "#f8fafc",
  fontSize: "clamp(17px, 2vw, 22px)",
  lineHeight: 1.35,
  fontWeight: 850
};

const launchPromotionSavings = {
  color: "#dcfce7",
  fontSize: "clamp(16px, 1.8vw, 19px)",
  lineHeight: 1.35
};

const launchPromotionNote = {
  color: "#b6bcc8",
  fontSize: 13,
  fontWeight: 700
};

const businessPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 24,
  padding: "clamp(24px, 5vw, 36px)",
  background:
    "radial-gradient(520px 240px at 18% 0%, rgba(var(--brand-primary-rgb),.18), transparent 62%), radial-gradient(420px 220px at 92% 12%, rgba(var(--brand-deep-rgb),.13), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(8,8,10,.96), rgba(4,4,6,.98))"
};

const businessIntro = {
  margin: 0,
  color: "#e5e7eb",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 600
};

const managementCopyGrid = {
  display: "grid",
  gap: 14
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

const outcomeSection = {
  gridColumn: "1 / -1",
  display: "grid",
  gap: 18,
  padding: 22,
  borderRadius: 24,
  border: "1px solid rgba(var(--brand-deep-rgb),.28)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.018)), rgba(8,8,10,.72)"
};

const outcomeHeader = {
  display: "grid",
  gap: 12
};

const outcomeHeading = {
  maxWidth: 760,
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(30px, 4vw, 52px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const outcomeGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 14
};

const outcomeCard = {
  display: "grid",
  gap: 10,
  alignContent: "start",
  minHeight: 150,
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.026)"
};

const outcomeTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 18,
  lineHeight: 1.15,
  fontWeight: 900
};

const outcomeCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 14,
  lineHeight: 1.55,
  fontWeight: 600
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
