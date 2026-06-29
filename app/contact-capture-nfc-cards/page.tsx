import Link from "next/link";
import type { CSSProperties } from "react";
import { CapturePassBrandArt } from "@/components/shared/capturepass-brand-art";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shared/shell";
import { buildFaqJsonLd, buildPageMetadata, buildSoftwareApplicationJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "CapturePass helps professionals and teams turn introductions into saved contacts with premium Contact Capture NFC Cards.",
  path: "/contact-capture-nfc-cards",
  title: "Contact Capture NFC Cards | CapturePass"
});

const faqItems = [
  {
    question: "What is a Contact Capture NFC Card?",
    answer:
      "A Contact Capture NFC Card is a physical card that lets someone instantly open your digital profile and save your contact information with a tap."
  },
  {
    question: "Does the other person need an app?",
    answer: "No. CapturePass works directly in the browser."
  },
  {
    question: "Can I update my information later?",
    answer: "Yes. Your card stays the same while your profile can be updated whenever you need."
  },
  {
    question: "Does it work on iPhone and Android?",
    answer: "Yes. Modern iPhones and Android phones support NFC or QR scanning."
  },
  {
    question: "Can businesses manage multiple employees?",
    answer: "Yes. CapturePass includes team management options designed for businesses of every size."
  }
];

const featureCards = [
  {
    copy: "Share with a tap.",
    icon: "01",
    title: "Instant NFC Sharing"
  },
  {
    copy: "Works even if NFC isn’t available.",
    icon: "02",
    title: "QR Code Backup"
  },
  {
    copy: "Everything opens inside the browser.",
    icon: "03",
    title: "No App Required"
  },
  {
    copy: "Update your information without replacing your card.",
    icon: "04",
    title: "Always Up To Date"
  },
  {
    copy: "Modern. Clean. Memorable.",
    icon: "05",
    title: "Professional Appearance"
  },
  {
    copy: "Networking events. Sales appointments. Trade shows. Customer meetings. Everywhere conversations happen.",
    icon: "06",
    title: "Works Everywhere"
  }
];

const trustCards = [
  { href: "/dealerships", icon: "AU", label: "Automotive" },
  { href: "/insurance-agents", icon: "IN", label: "Insurance" },
  { href: "/real-estate-agents", icon: "RE", label: "Real Estate" },
  { href: "/business", icon: "FS", label: "Financial Services" },
  { href: "/business", icon: "RC", label: "Recruiting" },
  { href: "/business", icon: "GB", label: "General Business" }
];

const softwareApplicationSchema = buildSoftwareApplicationJsonLd({
  description:
    "CapturePass contact capture NFC cards help professionals make it easy for people to save their information instantly.",
  name: "Contact Capture NFC Cards",
  path: "/contact-capture-nfc-cards"
});

function HeroMockup() {
  return (
    <div style={heroVisualStage} aria-hidden="true">
      <div style={floatingCard}>
        <div style={badgeRow}>
          <span style={microBadge}>NFC CARD</span>
          <span style={microBadgeSecondary}>Tap or scan</span>
        </div>
        <div style={floatingCardLogo}>
          <CapturePassBrandArt variant="logoMark" />
        </div>
        <div style={floatingCardCopy}>Contact capture, simplified.</div>
      </div>

      <div style={phoneMock}>
        <div style={phoneFrameTop}>
          <span style={phoneSignal} />
          <span style={phoneTime}>12:28</span>
          <span style={phoneStatus} />
        </div>

        <div style={phoneScreen}>
          <div style={phoneLockup}>
            <CapturePassBrandArt variant="logoLockup" />
          </div>

          <div style={profileCard}>
            <div style={profileAvatar}>JK</div>
            <div style={profileName}>John Keating</div>
            <div style={profileLabel}>CapturePass contact card</div>
          </div>

          <div style={phoneActionPrimary}>Add to Contacts</div>
          <div style={phoneActionSecondary}>Text</div>
          <div style={phoneActionSecondary}>Share My Contact</div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ copy, icon, title }: { copy: string; icon: string; title: string }) {
  return (
    <article className="home-industry-card card tagg-card">
      <div style={featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function TrustCard({
  href,
  icon,
  label
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link href={href} className="home-industry-card card tagg-card" style={trustCardLink}>
      <div style={trustIcon}>{icon}</div>
      <h3>{label}</h3>
      <p>Built for professionals who grow through relationships.</p>
    </Link>
  );
}

export default function ContactCaptureNfcCardsPage() {
  return (
    <>
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={buildFaqJsonLd(faqItems)} />

      <Shell
        footerLeft="Contact Capture NFC Cards"
        footerRight="CapturePass"
        pageVariant="light"
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/how-it-works", label: "How it works" },
          { href: "/business/pricing", label: "Business Pricing" },
          { href: "/business", label: "Business" },
          { href: "/resources", label: "Resources" }
        ]}
      >
        <section className="section-wrap home-hero" style={heroSection}>
          <div style={heroLayout}>
            <div style={heroCopyCol}>
              <div className="kicker">
                <span className="mini-star">✦</span>
                <span>CONTACT CAPTURE NFC CARDS</span>
              </div>
              <h1 style={heroTitle}>Contact Capture NFC Cards That Turn Every Introduction Into A Lasting Connection.</h1>
              <p style={heroLead}>
                Paper business cards are easy to hand out. They’re also easy to lose. CapturePass makes it effortless
                for people to save your information instantly with a simple tap or scan.
              </p>
              <p style={heroLeadSecondary}>No app. No typing. No wondering if they’ll remember you tomorrow.</p>
              <div style={heroButtons}>
                <Link className="button primary" href="/business/pricing">
                  Get Your CapturePass
                </Link>
                <Link className="button secondary" href="/business/pricing">
                  View Business Pricing
                </Link>
              </div>
            </div>

            <div style={heroVisualCol}>
              <HeroMockup />
            </div>
          </div>
        </section>

        <section className="section-wrap home-section home-usecase-layout">
          <article className="home-feature-card">
            <div className="dashboard-kicker">The problem</div>
            <h2>The Problem Isn’t Sharing Your Card. It’s Being Remembered.</h2>
            <p>
              Every professional has handed someone a business card only to wonder if it ever made it into their
              contacts.
            </p>
            <p>
              Most never do. Paper cards get misplaced. QR codes require someone to pull out their camera. Typing
              names, phone numbers, and email addresses creates friction. CapturePass removes every unnecessary step.
            </p>
            <p>One tap opens your profile. One tap saves your information. That’s it.</p>
          </article>

          <div className="home-usecase-grid">
            <article className="home-usecase-card card tagg-card">
              <div className="home-usecase-label">Lost Business Cards</div>
              <h3>Lost Business Cards</h3>
              <p>Paper disappears.</p>
            </article>
            <article className="home-usecase-card card tagg-card">
              <div className="home-usecase-label">Manual Contact Entry</div>
              <h3>Manual Contact Entry</h3>
              <p>Typing creates friction.</p>
            </article>
            <article className="home-usecase-card card tagg-card">
              <div className="home-usecase-label">Instant Contact Saving</div>
              <h3>Instant Contact Saving</h3>
              <p>CapturePass eliminates both.</p>
            </article>
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>Built for real conversations</span>
            </div>
            <h2>Built For Real Conversations.</h2>
            <p>
              Networking shouldn’t feel like exchanging paperwork. CapturePass keeps the conversation moving while
              making sure people leave with your information already saved.
            </p>
            <p>
              Whether you’re meeting someone at a dealership, conference, open house, networking event, coffee shop,
              or client appointment, your information is only one tap away.
            </p>
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>Feature grid</span>
            </div>
            <h2>Six Ways CapturePass Keeps The Conversation Moving.</h2>
          </div>

          <div className="home-industry-grid">
            {featureCards.map((card) => (
              <FeatureCard key={card.title} copy={card.copy} icon={card.icon} title={card.title} />
            ))}
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>How it works</span>
            </div>
            <h2>Three Steps. One Better First Impression.</h2>
          </div>

          <div className="home-step-grid">
            <article className="home-step-card">
              <div className="home-step-eyebrow">Step One</div>
              <h3>Tap Your CapturePass Card</h3>
              <p>Your customer taps your NFC card or scans the QR code.</p>
            </article>
            <article className="home-step-card">
              <div className="home-step-eyebrow">Step Two</div>
              <h3>Your Profile Opens Instantly</h3>
              <p>Your customized CapturePass page loads in seconds.</p>
            </article>
            <article className="home-step-card">
              <div className="home-step-eyebrow">Step Three</div>
              <h3>Save Your Contact</h3>
              <p>Your information is saved immediately so they never need to remember to do it later.</p>
            </article>
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>Comparison</span>
            </div>
            <h2>Why Professionals Are Leaving Paper Behind.</h2>
          </div>

          <div style={tableShell}>
            <table style={comparisonTable} aria-label="Comparison between paper business cards and CapturePass">
              <thead>
                <tr>
                  <th style={comparisonHeadCell}>Paper Business Cards</th>
                  <th style={comparisonHeadCell}>CapturePass</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={comparisonCell}>Can be lost.</td>
                  <td style={comparisonCell}>Always current.</td>
                </tr>
                <tr>
                  <td style={comparisonCell}>Become outdated.</td>
                  <td style={comparisonCell}>Always available.</td>
                </tr>
                <tr>
                  <td style={comparisonCell}>Require manual entry.</td>
                  <td style={comparisonCell}>Always one tap away.</td>
                </tr>
                <tr>
                  <td style={comparisonCell}>Cannot be updated.</td>
                  <td style={comparisonCell}>Designed for follow-up.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>Follow-up</span>
            </div>
            <h2>The Sale Usually Doesn’t Happen During The Introduction.</h2>
            <p>
              Relationships grow through follow-up. CapturePass makes follow-up easier because your contact
              information is already where it belongs inside your customer’s phone.
            </p>
            <p>
              Instead of wondering if someone kept your card, you can focus on continuing the conversation.
            </p>
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>Trust</span>
            </div>
            <h2>Designed For Professionals Who Meet People Every Day.</h2>
          </div>

          <div className="home-industry-grid">
            {trustCards.map((card) => (
              <TrustCard key={card.label} href={card.href} icon={card.icon} label={card.label} />
            ))}
          </div>
        </section>

        <section className="section-wrap home-section" style={finalCtaSection}>
          <div className="home-final-copy home-cta-copy" style={finalCopy}>
            <h2>Every Handshake Is An Opportunity.</h2>
            <p>Don’t Let It End With A Forgotten Business Card.</p>
            <div style={finalButtons}>
              <Link className="button primary" href="/business/pricing">
                Start With CapturePass
              </Link>
              <Link className="button secondary" href="/business/pricing">
                Business Pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="section-wrap home-section">
          <div className="home-section-head home-section-head-wide">
            <div className="kicker">
              <span className="mini-star">✦</span>
              <span>FAQ</span>
            </div>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div style={faqGrid}>
            {faqItems.map((item) => (
              <details className="card tagg-card" key={item.question} style={faqCard}>
                <summary style={faqSummary}>{item.question}</summary>
                <p style={faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </Shell>
    </>
  );
}

const heroSection = {
  paddingBottom: 44
} satisfies CSSProperties;

const heroLayout = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 28
} satisfies CSSProperties;

const heroCopyCol = {
  flex: "1 1 540px",
  display: "grid",
  gap: 14
} satisfies CSSProperties;

const heroTitle = {
  margin: "12px 0 0",
  maxWidth: 960,
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "clamp(52px, 6.9vw, 98px)",
  lineHeight: 0.94,
  letterSpacing: "-0.045em",
  color: "var(--brand-charcoal)"
} satisfies CSSProperties;

const heroLead = {
  margin: 0,
  maxWidth: 780,
  color: "#5f6674",
  fontSize: "clamp(18px, 2vw, 21px)",
  lineHeight: 1.68,
  fontWeight: 500
} satisfies CSSProperties;

const heroLeadSecondary = {
  margin: 0,
  maxWidth: 760,
  color: "#5f6674",
  fontSize: "clamp(17px, 1.8vw, 19px)",
  lineHeight: 1.65,
  fontWeight: 500
} satisfies CSSProperties;

const heroButtons = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  maxWidth: 520,
  marginTop: 18
} satisfies CSSProperties;

const heroVisualCol = {
  flex: "1 1 420px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
} satisfies CSSProperties;

const heroVisualStage = {
  position: "relative",
  width: "100%",
  maxWidth: 560,
  minHeight: 520
} satisfies CSSProperties;

const floatingCard = {
  position: "absolute",
  left: 0,
  top: 88,
  width: "clamp(220px, 40vw, 292px)",
  padding: 22,
  borderRadius: 28,
  border: "1px solid rgba(15,23,42,.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.92))",
  boxShadow: "0 20px 54px rgba(15,23,42,.12)",
  transform: "rotate(-7deg)"
} satisfies CSSProperties;

const badgeRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16
} satisfies CSSProperties;

const microBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(var(--brand-primary-rgb),.08)",
  color: "var(--brand-primary)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em"
} satisfies CSSProperties;

const microBadgeSecondary = {
  color: "#5f6674",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
} satisfies CSSProperties;

const floatingCardLogo = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 14
} satisfies CSSProperties;

const floatingCardCopy = {
  color: "#5f6674",
  fontSize: 15,
  fontWeight: 600,
  textAlign: "center" as const
} satisfies CSSProperties;

const phoneMock = {
  position: "relative",
  marginLeft: "auto",
  width: "clamp(280px, 46vw, 360px)",
  borderRadius: 34,
  padding: 10,
  background: "linear-gradient(180deg, #ffffff, #f5f7fb)",
  border: "1px solid rgba(15,23,42,.08)",
  boxShadow: "0 28px 70px rgba(15,23,42,.14)",
  transform: "rotate(3deg)"
} satisfies CSSProperties;

const phoneFrameTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  height: 42,
  padding: "0 12px"
} satisfies CSSProperties;

const phoneSignal = {
  width: 44,
  height: 10,
  borderRadius: 999,
  background:
    "linear-gradient(90deg, rgba(15,23,42,.14), rgba(15,23,42,.08)), linear-gradient(180deg, rgba(255,255,255,.92), rgba(243,246,250,.92))"
} satisfies CSSProperties;

const phoneTime = {
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "-0.02em"
} satisfies CSSProperties;

const phoneStatus = {
  width: 54,
  height: 10,
  borderRadius: 999,
  background:
    "linear-gradient(90deg, rgba(var(--brand-primary-rgb),.24), rgba(var(--brand-deep-rgb),.12)), linear-gradient(180deg, rgba(255,255,255,.92), rgba(243,246,250,.92))"
} satisfies CSSProperties;

const phoneScreen = {
  display: "grid",
  gap: 14,
  padding: "18px 18px 22px",
  borderRadius: 28,
  background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(246,249,253,.95))",
  border: "1px solid rgba(15,23,42,.08)"
} satisfies CSSProperties;

const phoneLockup = {
  display: "flex",
  justifyContent: "center",
  marginTop: 2,
  marginBottom: 4
} satisfies CSSProperties;

const profileCard = {
  display: "grid",
  justifyItems: "center",
  gap: 10,
  padding: "18px 18px 20px",
  borderRadius: 26,
  background:
    "radial-gradient(circle at 50% 0%, rgba(var(--brand-primary-rgb),.12), transparent 58%), linear-gradient(180deg, rgba(255,255,255,.98), rgba(244,247,251,.95))",
  border: "1px solid rgba(15,23,42,.08)",
  boxShadow: "0 18px 34px rgba(15,23,42,.08)"
} satisfies CSSProperties;

const profileAvatar = {
  width: 96,
  height: 96,
  display: "grid",
  placeItems: "center",
  borderRadius: 28,
  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-deep))",
  color: "#ffffff",
  fontFamily: "var(--font-heading)",
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: "-0.04em",
  boxShadow: "0 16px 32px rgba(var(--brand-primary-rgb),.18)"
} satisfies CSSProperties;

const profileName = {
  color: "#0f172a",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(24px, 3vw, 30px)",
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "-0.04em",
  textAlign: "center" as const
} satisfies CSSProperties;

const profileLabel = {
  color: "#5f6674",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  textAlign: "center" as const
} satisfies CSSProperties;

const phoneActionPrimary = {
  display: "grid",
  placeItems: "center",
  minHeight: 64,
  borderRadius: 20,
  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-deep))",
  color: "#ffffff",
  fontSize: 18,
  fontWeight: 800,
  boxShadow: "0 12px 28px rgba(var(--brand-primary-rgb),.22)"
} satisfies CSSProperties;

const phoneActionSecondary = {
  display: "grid",
  placeItems: "center",
  minHeight: 60,
  borderRadius: 20,
  background: "rgba(var(--brand-primary-rgb),.06)",
  border: "1px solid rgba(var(--brand-primary-rgb),.16)",
  color: "var(--brand-primary)",
  fontSize: 16,
  fontWeight: 800
} satisfies CSSProperties;

const featureIcon = {
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  borderRadius: 14,
  background: "rgba(var(--brand-primary-rgb),.08)",
  border: "1px solid rgba(var(--brand-primary-rgb),.12)",
  color: "var(--brand-primary)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em"
} satisfies CSSProperties;

const trustCardLink = {
  textDecoration: "none"
} satisfies CSSProperties;

const trustIcon = {
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  background: "rgba(var(--brand-primary-rgb),.08)",
  border: "1px solid rgba(var(--brand-primary-rgb),.14)",
  color: "var(--brand-primary)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em"
} satisfies CSSProperties;

const tableShell = {
  overflowX: "auto",
  borderRadius: 26,
  border: "1px solid rgba(15,23,42,.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.92))",
  boxShadow: "0 18px 44px rgba(15,23,42,.08)"
} satisfies CSSProperties;

const comparisonTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
  tableLayout: "fixed" as const
} satisfies CSSProperties;

const comparisonHeadCell = {
  padding: "18px 18px 14px",
  textAlign: "left" as const,
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  borderBottom: "1px solid rgba(15,23,42,.08)"
} satisfies CSSProperties;

const comparisonCell = {
  padding: "18px",
  verticalAlign: "top",
  color: "#5f6674",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 500,
  borderBottom: "1px solid rgba(15,23,42,.08)"
} satisfies CSSProperties;

const finalCtaSection = {
  background:
    "radial-gradient(circle at top left, rgba(var(--brand-primary-rgb),.18), transparent 36%), linear-gradient(180deg, rgba(var(--brand-primary-rgb),.04), rgba(var(--brand-primary-rgb),.12))",
  borderRadius: 36,
  border: "1px solid rgba(var(--brand-primary-rgb),.12)",
  paddingTop: 0
} satisfies CSSProperties;

const finalCopy = {
  maxWidth: 900
} satisfies CSSProperties;

const finalButtons = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  maxWidth: 520,
  marginTop: 10
} satisfies CSSProperties;

const faqGrid = {
  display: "grid",
  gap: 14
} satisfies CSSProperties;

const faqCard = {
  padding: 22
} satisfies CSSProperties;

const faqSummary = {
  cursor: "pointer",
  color: "#0f172a",
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  listStyle: "none"
} satisfies CSSProperties;

const faqAnswer = {
  margin: "12px 0 0",
  color: "#5f6674",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 500
} satisfies CSSProperties;
