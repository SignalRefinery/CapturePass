import { BUSINESS_PLANS, type BusinessPlanKey } from "@/lib/business/plans";
import { Shell } from "@/components/shared/shell";
import { BusinessPricingPlans } from "./business-pricing-plans";

const businessTierKeys = [
  ["business_starter_self", "business_starter_managed"],
  ["business_growth_self", "business_growth_managed"],
  ["business_pro_self", "business_pro_managed"]
] as const satisfies readonly [BusinessPlanKey, BusinessPlanKey][];

const selfManagedDescription =
  "Self-managed gives your organization admin access to manage seats, profiles, branding, and card assignments directly.";

const fullyManagedDescription =
  "Fully managed means your team sends us new hires, departures, and profile changes. We handle setup, deactivation, card assignment, seat reassignment, and basic profile updates.";

const businessFeatures = [
  "Business-branded profile pages",
  "Reusable employee seats",
  "Included NFC cards at setup",
  "Permanent card/pass token assignment",
  "Employee activation and deactivation",
  "Card/profile reassignment",
  "Business contacts dashboard",
  "Business analytics",
  "Team leaderboard",
  "Review, booking, menu, and form links",
  "CSV/export-ready contact data",
  "Optional fully managed operations"
];

const businessTiers = businessTierKeys.map(([selfKey, managedKey]) => {
  const selfPlan = BUSINESS_PLANS[selfKey];
  const managedPlan = BUSINESS_PLANS[managedKey];

  return {
    cards: selfPlan.includedCards,
    managed: {
      annualPrice: managedPlan.annualPrice,
      key: managedPlan.key,
      label: "Fully Managed",
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

export default function BusinessPricingPage() {
  return (
    <Shell
      footerLeft="Business Pricing"
      footerRight="TapTagg"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "User Pricing" },
        { href: "/business", label: "Business" }
      ]}
    >
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Business Pricing</span>
        </div>
        <h1 style={heroHeading}>Reusable seats. Included cards. Clean team control.</h1>
        <p style={heroCopy}>
          Pick a seat capacity, choose self-managed or fully managed, and launch with
          NFC cards included based on purchased capacity, not currently filled seats.
        </p>
      </section>

      <section className="section-wrap">
        <section className="card tagg-card tagg-card-feature" style={businessPanel}>
          <div style={{ display: "grid", gap: 16 }}>
            <div className="kicker" style={{ width: "fit-content" }}>
              <span className="mini-star">✦</span>
              <span>How Business Works</span>
            </div>

            <p style={businessIntro}>
              Cards are included based on purchased plan capacity, not currently filled seats.
              If a Growth customer has 14 active employees at signup, they still receive 25 NFC
              cards because they purchased 25 reusable seats.
            </p>
          </div>

          <div style={managementCopyGrid}>
            <div style={businessQuoteCard}>
              <div style={quoteLabel}>Self-managed</div>
              <p style={quoteCopy}>{selfManagedDescription}</p>
            </div>
            <div style={businessQuoteCard}>
              <div style={quoteLabel}>Fully managed</div>
              <p style={quoteCopy}>{fullyManagedDescription}</p>
            </div>
          </div>

          <BusinessPricingPlans tiers={businessTiers} />

          <div style={businessFeatureGrid}>
            {businessFeatures.map((feature) => (
              <div key={feature} style={businessFeature}>
                {feature}
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

const businessPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 24,
  padding: "clamp(24px, 5vw, 36px)",
  background:
    "radial-gradient(520px 240px at 18% 0%, rgba(139,92,246,.18), transparent 62%), radial-gradient(420px 220px at 92% 12%, rgba(79,70,229,.13), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(8,8,10,.96), rgba(4,4,6,.98))"
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
  border: "1px solid rgba(167,139,250,.28)",
  background: "rgba(139,92,246,.08)"
};

const quoteLabel = {
  color: "#d8ccff",
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
