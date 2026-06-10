import Link from "next/link";
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPES } from "@/lib/business-types";
import { BUSINESS_INDIVIDUAL_PROMO_CODE } from "@/lib/plans";
import { Shell } from "@/components/shared/shell";

const includedFeatures = [
  "Active TapTagg business profile",
  "Custom printed NFC TapTagg card",
  "NFC sharing",
  "QR sharing",
  "Profile link sharing",
  "Add-to-contacts / vCard saving",
  "Contact Capture",
  "Contact management dashboard",
  "Individual contact downloads",
  "CRM-ready exports",
  "Contact analytics",
  "Full engagement analytics",
  "Views and unique visitors",
  "QR, NFC, and source tracking",
  "Button click analytics",
  "Advanced profile customization",
  "Custom buttons",
  "Advanced branding",
  "Business profile setup",
  "Onboarding assistance",
  "Priority support"
];


const faqItems = [
  {
    question: "Who is Business Individual for?",
    answer:
      "Business Individual is for solo professionals who need lead capture, relationship management, networking tools, and follow-up capabilities without needing a full team account."
  },
  {
    question: "How is this different from a team plan?",
    answer:
      "Business Individual supports one professional. Team plans include reusable seats, employee management, shared branding controls, team analytics, and card reassignment."
  },
  {
    question: "Does this include a custom printed card?",
    answer: "Yes. Business Individual includes one custom printed NFC TapTagg card."
  },
  {
    question: "Can I add more cards?",
    answer: "Yes. Additional cards are available for $25 each."
  },
  {
    question: "Is the $99 price permanent?",
    answer:
      "No. $99/year is a limited launch offer available through July 31, 2026. The regular price is $199/year after the launch period."
  },
  {
    question: "Is this page public?",
    answer: "No. This offer is currently available through direct access during the launch period."
  }
];

function checkoutNoticeFor(value?: string | null) {
  switch (value) {
    case "missing-business-type":
      return "Choose a business type before starting Business Individual checkout.";
    case "invalid-business-type":
      return "Choose a supported business type before starting Business Individual checkout.";
    case "unavailable":
      return "Business Individual checkout is temporarily unavailable. Please try again in a few minutes.";
    case "start-error":
      return "We could not start checkout just now. Please try again.";
    default:
      return null;
  }
}

export default async function BusinessIndividualPage({
  searchParams
}: {
  searchParams?: Promise<{
    checkout?: string;
    promo_code?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const checkoutNotice = checkoutNoticeFor(params.checkout);
  const promoCode = params.promo_code?.toUpperCase() === BUSINESS_INDIVIDUAL_PROMO_CODE
    ? BUSINESS_INDIVIDUAL_PROMO_CODE
    : params.promo_code || "";

  return (
    <Shell footerLeft="Business Individual" footerRight="TapTagg">
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Limited Launch Offer</span>
        </div>
        <h1 style={heroHeading}>Business Individual</h1>
        <p style={heroSubheadline}>
          Built for professionals who depend on relationships, referrals, and follow-up.
        </p>
        <p style={heroCopy}>
          Capture contacts, track engagement, and stay connected with prospects, clients, and referral partners — without needing a full team account.
        </p>
        <div style={launchCallout}>
          <span>Limited Launch Offer</span>
          <strong>$99/year through July 31, 2026</strong>
          <small>Regularly $199/year after July 31, 2026</small>
          <small>Available by direct link during the launch period.</small>
        </div>
        {checkoutNotice ? <div style={checkoutNoticeStyle}>{checkoutNotice}</div> : null}
      </section>

      <section className="section-wrap">
        <div style={layoutGrid}>
          <article className="card tagg-card tagg-card-feature" style={planCard}>
            <div style={planTopRow}>
              <div>
                <div style={badge}>Limited Launch Offer</div>
                <h2 style={planName}>Business Individual</h2>
              </div>
              <div style={priceBlock}>
                <span style={price}>$99</span>
                <span style={cadence}>/ year</span>
              </div>
            </div>

            <p style={regularPrice}>Regularly $199/year after July 31, 2026</p>

            <form action="/api/checkout" method="GET" style={checkoutForm}>
              <input type="hidden" name="plan" value="business_individual" />
              <label style={selectLabel}>
                Business type
                <select name="business_type" required style={selectInput} defaultValue="">
                  <option value="" disabled>
                    Choose your business type
                  </option>
                  {BUSINESS_TYPES.map((businessType) => (
                    <option key={businessType} value={businessType}>
                      {BUSINESS_TYPE_LABELS[businessType]}
                    </option>
                  ))}
                </select>
              </label>
              <label style={selectLabel}>
                Promo code
                <input
                  name="promo_code"
                  style={selectInput}
                  placeholder="Optional: Enter promo code if you have one"
                  defaultValue={promoCode}
                  autoComplete="off"
                />
              </label>
              <button className="button primary" type="submit" style={{ width: "fit-content" }}>
                Start Business Individual
              </button>
            </form>

            <div style={featureGrid}>
              {includedFeatures.map((feature) => (
                <div key={feature} style={featureItem}>
                  {feature}
                </div>
              ))}
            </div>
          </article>

          <aside style={sideStack}>
            <section className="card tagg-card" style={sideCard}>
              <div className="dashboard-kicker">Need a team plan?</div>
              <h2 style={sideHeading}>Upgrade when you are ready to manage multiple people.</h2>
              <p style={sideCopy}>
                Business Individual is built for one professional. Team plans add reusable seats, employee management, shared company branding, team contacts, team analytics, card reassignment, and organization-wide management tools.
              </p>
              <Link className="button secondary" href="/business/pricing" style={{ width: "fit-content" }}>
                View Team Plans
              </Link>
            </section>

            <section className="card tagg-card" style={sideCard}>
              <div className="dashboard-kicker">Additional Cards</div>
              <h2 style={sideHeading}>Additional Cards</h2>
              <p style={sideCopy}>
                Need extra cards for events, backup use, or multiple locations? Add additional TapTagg cards for $25 each.
              </p>
              <div style={extraCardPrice}>$25 per card</div>
              <Link className="button primary" href="/api/checkout?plan=business_individual_extra_card" style={{ width: "fit-content" }}>
                Add Extra Card
              </Link>
            </section>
          </aside>
        </div>

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
  margin: "28px auto 14px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(58px, 8vw, 108px)",
  lineHeight: 0.9,
  letterSpacing: "-0.05em",
  fontWeight: 800
};

const heroSubheadline = {
  maxWidth: 820,
  margin: "0 auto",
  color: "#ffffff",
  fontSize: "clamp(22px, 2.6vw, 32px)",
  lineHeight: 1.2,
  fontWeight: 800
};

const heroCopy = {
  maxWidth: 780,
  margin: "18px auto 0",
  color: "#b6bcc8",
  fontSize: "clamp(17px, 2vw, 21px)",
  lineHeight: 1.6,
  fontWeight: 500
};

const launchCallout = {
  width: "fit-content",
  maxWidth: "min(100%, 720px)",
  margin: "26px auto 0",
  display: "grid",
  gap: 8,
  padding: "18px 22px",
  borderRadius: 24,
  border: "1px solid rgba(167,139,250,.34)",
  background:
    "radial-gradient(300px 140px at 20% 0%, rgba(139,92,246,.22), transparent 70%), rgba(139,92,246,.1)",
  color: "#ffffff",
  textAlign: "center" as const
};

const checkoutNoticeStyle = {
  width: "fit-content",
  maxWidth: "min(100%, 680px)",
  margin: "18px auto 0",
  padding: "12px 16px",
  borderRadius: 16,
  border: "1px solid rgba(251,191,36,.4)",
  background: "rgba(251,191,36,.1)",
  color: "#fde68a",
  fontWeight: 800
};

const layoutGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
  gap: 20,
  alignItems: "start"
};

const planCard = {
  display: "grid",
  gap: 22,
  padding: "clamp(24px, 4vw, 34px)",
  background:
    "radial-gradient(520px 240px at 10% 0%, rgba(139,92,246,.2), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.016)), rgba(8,8,10,.94)"
};

const planTopRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
  flexWrap: "wrap" as const
};

const badge = {
  width: "fit-content",
  marginBottom: 14,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(139,92,246,.18)",
  color: "#d8ccff",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const planName = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(36px, 5vw, 62px)",
  lineHeight: 0.95,
  letterSpacing: "-0.045em",
  fontWeight: 800
};

const priceBlock = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  color: "#ffffff"
};

const price = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(48px, 6vw, 76px)",
  lineHeight: 0.9,
  letterSpacing: "-0.045em",
  fontWeight: 800
};

const cadence = {
  color: "#b6bcc8",
  fontSize: 18,
  fontWeight: 800
};

const regularPrice = {
  margin: 0,
  color: "#d8ccff",
  fontSize: 15,
  fontWeight: 800
};

const checkoutForm = {
  display: "grid",
  gap: 14,
  maxWidth: 520
};

const selectLabel = {
  display: "grid",
  gap: 8,
  color: "#d8ccff",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const selectInput = {
  width: "100%",
  minHeight: 50,
  borderRadius: 16,
  border: "1px solid rgba(167,139,250,.32)",
  background: "rgba(255,255,255,.06)",
  color: "#ffffff",
  padding: "0 14px",
  fontSize: 15,
  fontWeight: 800
};

const featureGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10
};

const featureItem = {
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.045)",
  color: "#e5e7eb",
  fontSize: 14,
  lineHeight: 1.35,
  fontWeight: 750
};

const sideStack = {
  display: "grid",
  gap: 20
};

const sideCard = {
  display: "grid",
  gap: 16,
  padding: 24
};

const sideHeading = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(26px, 3vw, 36px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const sideCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 15,
  lineHeight: 1.6
};


const extraCardPrice = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(34px, 4vw, 48px)",
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const faqSection = {
  display: "grid",
  gap: 22,
  marginTop: 32
};

const sectionHeading = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 0.96,
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const faqGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 16
};

const faqCard = {
  padding: 22,
  display: "grid",
  gap: 10
};

const faqQuestion = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.2
};

const faqAnswer = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 14,
  lineHeight: 1.55
};
