import Link from "next/link";
import { Shell } from "@/components/shared/shell";

const individualPlans = [
  {
    name: "Free / Reserved Tagg",
    price: "Free",
    purpose: "Claim a handle, build your profile, and preview your TapTagg before activation.",
    cta: "Claim Your Tagg",
    href: "/signup",
    features: [
      "Reserve your @tagg for 14 days",
      "Build your profile",
      "Add basic links and socials",
      "Preview your TapTagg page",
      "Reminder emails before your reservation expires"
    ],
    limits: [
      "Not publicly active until activated",
      "No NFC sharing",
      "Limited customization"
    ]
  },
  {
    name: "Core",
    price: "$29",
    cadence: "one-time",
    purpose: "Activate your TapTagg with a physical card and start sharing in the real world.",
    cta: "Get Your Tagg",
    href: "/signup",
    featured: true,
    features: [
      "1 TapTagg card",
      "Activate your TapTagg profile",
      "NFC sharing",
      "QR sharing",
      "Unlimited profile updates",
      "Expanded links and socials",
      "Basic themes"
    ]
  },
  {
    name: "Tagg+",
    price: "$49",
    cadence: "/ year",
    purpose: "The best everyday plan for people who share often and want more control.",
    cta: "Upgrade to Tagg+",
    href: "/signup",
    features: [
      "Everything in Core",
      "Advanced customization",
      "Basic analytics",
      "Lead/contact capture",
      "Custom buttons",
      "Priority support"
    ]
  },
  {
    name: "Creator",
    price: "$99",
    cadence: "/ year",
    purpose: "For creators, musicians, salespeople, realtors, and small brands.",
    cta: "Start Creator",
    href: "/signup",
    features: [
      "Everything in Tagg+",
      "Advanced analytics",
      "More profile sections",
      "Music/video/content embeds",
      "Booking links",
      "Smart redirects",
      "Contact export",
      "Multiple TapTagg cards supported"
    ]
  }
];

const businessFeatures = [
  "Custom branded profile pages",
  "Custom cards with company logo",
  "Team dashboard",
  "Employee activation/deactivation",
  "Card/profile reassignment",
  "Shared company templates",
  "Lead capture",
  "Review links",
  "Analytics",
  "CRM/export-ready contact data",
  "Onboarding and setup support",
  "Replacement/new hire card management"
];

const faqItems = [
  {
    question: "Can I build a profile before buying?",
    answer:
      "Yes. The Free / Reserved Tagg tier lets you claim a handle, build your profile, add basic links, and preview your page before activation."
  },
  {
    question: "How long is my username reserved?",
    answer:
      "Your @tagg is reserved for 14 days. We send reminder emails before the reservation expires."
  },
  {
    question: "Do I need a physical card?",
    answer:
      "No. You can start by building your profile and sharing a QR or link after activation. The card makes real-world sharing faster."
  },
  {
    question: "Can businesses use custom branding?",
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
      "No. TapTagg is built for sharing, not tracking. We do not sell your personal data or usage patterns."
  }
];

export default function PricingPage() {
  return (
    <Shell
      footerLeft="Built For Sharing. Not Tracking."
      footerRight="TapTagg"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/custom", label: "Custom Taggs" }
      ]}
    >
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Pricing</span>
        </div>

        <h1 style={heroHeading}>Choose How You Tagg.</h1>

        <p style={heroCopy}>
          Start by claiming your Tagg, then activate it with a card or plan when you&apos;re ready.
        </p>

        <div style={trustLine}>Built For Sharing. Not Tracking.</div>
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

              {plan.limits ? (
                <div style={limitBox}>
                  {plan.limits.map((limit) => (
                    <div key={limit} style={limitItem}>
                      {limit}
                    </div>
                  ))}
                </div>
              ) : null}

              <Link className="button primary" href={plan.href} style={{ marginTop: "auto" }}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <section className="card tagg-card tagg-card-feature" style={businessPanel}>
          <div style={{ display: "grid", gap: 16 }}>
            <div className="kicker" style={{ width: "fit-content" }}>
              <span className="mini-star">✦</span>
              <span>Business</span>
            </div>

            <div>
              <h2 style={sectionHeading}>TapTagg For Teams & Businesses</h2>
              <p style={sectionCopy}>
                Custom branded TapTagg systems for dealerships, real estate teams,
                sales organizations, events, hospitality groups, and local businesses.
              </p>
            </div>

            <p style={businessIntro}>
              Built for teams that connect in person. Give every employee a branded,
              one-tap way to share contact info, links, reviews, booking pages, and more.
              Deactivate, update, or reassign profiles as your team changes.
            </p>
          </div>

          <div style={businessQuoteCard}>
            <div style={quoteLabel}>Custom quote</div>
            <div style={quotePrice}>Setup + annual platform pricing</div>
            <p style={quoteCopy}>
              Business pricing can include setup for branding, onboarding, and card
              design, an annual platform fee, and per-card pricing for new hires,
              replacements, or additional staff.
            </p>
            <Link className="button primary" href="/custom">
              Request Business Quote
            </Link>
          </div>

          <div style={businessFeatureGrid}>
            {businessFeatures.map((feature) => (
              <div key={feature} style={businessFeature}>
                {feature}
              </div>
            ))}
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
  border: "1px solid rgba(167,139,250,.28)",
  background: "rgba(139,92,246,.08)",
  color: "#d8ccff",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em"
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
  borderColor: "rgba(139,92,246,.52)",
  background:
    "radial-gradient(360px 160px at 50% 0%, rgba(139,92,246,.18), transparent 72%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.014)), rgba(12,12,15,.74)"
};

const planBadge = {
  position: "absolute" as const,
  top: 16,
  right: 16,
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid rgba(139,92,246,.36)",
  background: "rgba(139,92,246,.16)",
  color: "#d8ccff",
  fontSize: 12,
  fontWeight: 800
};

const planName = {
  color: "#d8ccff",
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
  borderLeft: "2px solid rgba(139,92,246,.42)",
  color: "#e5e7eb",
  fontSize: 14,
  lineHeight: 1.4,
  fontWeight: 600
};

const limitBox = {
  display: "grid",
  gap: 7,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.025)"
};

const limitItem = {
  color: "#9ca3af",
  fontSize: 13,
  lineHeight: 1.35
};

const businessPanel = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 24,
  padding: "clamp(24px, 5vw, 36px)",
  background:
    "radial-gradient(520px 240px at 18% 0%, rgba(139,92,246,.18), transparent 62%), radial-gradient(420px 220px at 92% 12%, rgba(79,70,229,.13), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(8,8,10,.96), rgba(4,4,6,.98))"
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
