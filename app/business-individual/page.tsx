import Link from "next/link";
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPES } from "@/lib/business-types";
import { BUSINESS_INDIVIDUAL_PROMO_CODE } from "@/lib/plans";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shared/shell";
import { CapturePassBrandArt } from "@/components/shared/capturepass-brand-art";
import { buildFaqJsonLd, buildPageMetadata, buildProductJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "Business Individual for solo professionals who need contact capture, branded NFC cards and mobile QR codes, analytics, and CRM-ready exports.",
  path: "/business-individual",
  title: "Business Individual"
});

const includedFeatures = [
  "Active CapturePass business profile",
  "Custom printed NFC CapturePass card",
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
    title: "Who is Business Individual for?",
    body:
      "Business Individual is for solo professionals who need lead capture, relationship management, networking tools, and follow-up capabilities without needing a full team account."
  },
  {
    title: "How is this different from a team plan?",
    body:
      "Business Individual supports one professional. Team plans include reusable seats, employee management, shared branding controls, team analytics, and card reassignment."
  },
  {
    title: "Does this include a custom printed card?",
    body: "Yes. Business Individual includes one custom printed NFC CapturePass card designed with your branding."
  },
  {
    title: "Does this include contact capture?",
    body: "Yes. Visitors can share their contact information directly from your CapturePass profile. Leads are stored in your dashboard and can be exported to CSV at any time."
  },
  {
    title: "Is this CRM ready?",
    body: "Yes. Export contacts as CSV files for import into your CRM, marketing platform, or follow-up workflow."
  },
  {
    title: "Can I add more cards?",
    body: "Yes. Additional CapturePass cards can be ordered for $25 each and linked to the same profile."
  },
  {
    title: "Do my contacts need an app?",
    body: "No. CapturePass works through any modern web browser. Your contacts can view your profile, save your information, and share their contact details without downloading anything."
  },
  {
    title: "Is the $99 price permanent?",
    body:
      "No. $99/year is a limited launch offer available through July 31, 2026. The regular price is $199/year after the launch period."
  }
];

const faqSchema = buildFaqJsonLd(
  faqItems.map((item) => ({
    answer: item.body,
    question: item.title
  }))
);
const productSchema = buildProductJsonLd({
  description:
    "Business Individual launch offer with a branded CapturePass profile, contact capture, analytics, and a custom printed NFC card.",
  name: "CapturePass Business Individual",
  path: "/business-individual",
  price: "99"
});

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
    <Shell
      footerLeft="Business Individual"
      footerRight="CapturePass"
      pageVariant="light"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={heroSection}>
        <div style={logoWrap}>
          <CapturePassBrandArt variant="logoMark" priority />
        </div>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Limited Launch Offer</span>
        </div>
        <h1 style={heroHeading}>Business Individual</h1>
        <p style={heroSubheadline}>
          Built for professionals who depend on relationships, referrals, and follow-up.
        </p>
        <p style={heroCopy}>
          Capture contacts, track engagement, and stay connected with prospects, clients, and referral partners - without needing a full team account.
        </p>
        <p style={heroHighlight}>
          NFC business cards and mobile QR codes are included, but the main value is contact capture, CRM-ready exports, and owned relationships.
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
                Start Capturing Contacts
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
                Need extra cards for events, backup use, or multiple locations? Add additional CapturePass cards for $25 each.
              </p>
              <div style={extraCardPrice}>$25 per card</div>
              <Link className="button primary" href="/api/checkout?plan=business_individual_extra_card" style={{ width: "fit-content" }}>
                Add Extra Card
              </Link>
            </section>

        <section className="card tagg-card" style={sideCard}>
              <div className="dashboard-kicker">More pages</div>
              <h2 style={sideHeading}>See the broader CapturePass funnel.</h2>
              <p style={sideCopy}>
                Compare pricing, explore business plans, and visit the industry landing pages for dealerships,
                real estate agents, insurance agents, sales teams, and NFC business cards and mobile QR codes.
              </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link className="button secondary" href="/business/pricing" style={{ width: "fit-content" }}>
                  Business Pricing
                </Link>
                <Link className="button secondary" href="/resources" style={{ width: "fit-content" }}>
                  Resources
                </Link>
                <Link className="button secondary" href="/springfield-il-contact-capture" style={{ width: "fit-content" }}>
                  Springfield Contact Capture
                </Link>
              </div>
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
              <div className="card" key={item.title} style={faqCard}>
                <h3 style={faqQuestion}>{item.title}</h3>
                <p style={faqAnswer}>{item.body}</p>
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
  margin: "24px auto 12px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(52px, 7vw, 92px)",
  lineHeight: 0.94,
  letterSpacing: "-0.045em",
  fontWeight: 800
};

const heroSubheadline = {
  maxWidth: 900,
  margin: "0 auto",
  color: "#2563eb",
  fontSize: "clamp(22px, 2.6vw, 30px)",
  lineHeight: 1.22,
  fontWeight: 800
};

const heroCopy = {
  maxWidth: 860,
  margin: "14px auto 0",
  color: "#5f6674",
  fontSize: "clamp(17px, 2vw, 20px)",
  lineHeight: 1.6,
  fontWeight: 500
};

const heroHighlight = {
  maxWidth: 860,
  margin: "8px auto 0",
  color: "#0f172a",
  fontSize: "clamp(15px, 1.6vw, 17px)",
  lineHeight: 1.6,
  fontWeight: 700
};

const heroSection = {
  paddingBottom: 28
};

const logoWrap = {
  width: "100%",
  maxWidth: 112,
  margin: "0 auto 12px"
};

const launchCallout = {
  width: "fit-content",
  maxWidth: "min(100%, 720px)",
  margin: "22px auto 0",
  display: "grid",
  gap: 8,
  padding: "16px 20px",
  borderRadius: 24,
  border: "1px solid rgba(37,99,235,.14)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  boxShadow: "0 16px 42px rgba(15,23,42,.08)",
  color: "#0f172a",
  textAlign: "center" as const
};

const checkoutNoticeStyle = {
  width: "fit-content",
  maxWidth: "min(100%, 680px)",
  margin: "18px auto 0",
  padding: "12px 16px",
  borderRadius: 16,
  border: "1px solid rgba(37,99,235,.16)",
  background: "rgba(37,99,235,.06)",
  color: "#1d4ed8",
  fontWeight: 800
};

const layoutGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
  gap: 28,
  alignItems: "start"
};

const planCard = {
  display: "grid",
  gap: 20,
  padding: "clamp(24px, 4vw, 32px)",
  border: "1px solid rgba(37,99,235,.14)",
  borderRadius: 24,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  boxShadow: "0 24px 70px rgba(15,23,42,.09)",
  color: "#0f172a"
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
  background: "rgba(37,99,235,.08)",
  color: "#2563eb",
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
  color: "#0f172a"
};

const price = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(48px, 6vw, 76px)",
  lineHeight: 0.9,
  letterSpacing: "-0.045em",
  fontWeight: 800,
  color: "#2563eb"
};

const cadence = {
  color: "#64748b",
  fontSize: 18,
  fontWeight: 800
};

const regularPrice = {
  margin: 0,
  color: "#1d4ed8",
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
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const selectInput = {
  width: "100%",
  minHeight: 50,
  borderRadius: 16,
  border: "1px solid rgba(37,99,235,.14)",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 14px",
  fontSize: 15,
  fontWeight: 800
};

const featureGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 12
};

const featureItem = {
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(37,99,235,.12)",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  lineHeight: 1.35,
  fontWeight: 750
};

const sideStack = {
  display: "grid",
  gap: 22
};

const sideCard = {
  display: "grid",
  gap: 14,
  padding: 26,
  border: "1px solid rgba(37,99,235,.12)",
  borderRadius: 24,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  boxShadow: "0 24px 70px rgba(15,23,42,.09)",
  color: "#0f172a"
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
  color: "#5f6674",
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
  marginTop: 28
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
  gap: 18
};

const faqCard = {
  padding: 24,
  display: "grid",
  gap: 10,
  height: "100%",
  border: "1px solid rgba(37,99,235,.12)",
  borderRadius: 24,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  boxShadow: "0 24px 70px rgba(15,23,42,.08)"
};

const faqQuestion = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.2
};

const faqAnswer = {
  margin: 0,
  color: "#5f6674",
  fontSize: 14,
  lineHeight: 1.55
};
