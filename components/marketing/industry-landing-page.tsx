import Link from "next/link";
import { Shell } from "@/components/shared/shell";

type IndustryLandingPageProps = {
  actionLinks: Array<{ href: string; label: string; primary?: boolean }>;
  audienceLabel: string;
  benefits: Array<{ copy: string; title: string }>;
  footerLeft: string;
  footerRight?: string;
  headline: string;
  intro: string;
  navLinks: Array<{ href: string; label: string }>;
  proofPoints: Array<{ copy: string; label: string }>;
  relatedLinks: Array<{ href: string; label: string }>;
  sections?: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  subheadline: string;
};

export function IndustryLandingPage({
  actionLinks,
  audienceLabel,
  benefits,
  footerLeft,
  footerRight = "CapturePass",
  headline,
  intro,
  navLinks,
  proofPoints,
  relatedLinks,
  sections,
  subheadline
}: IndustryLandingPageProps) {
  return (
    <Shell footerLeft={footerLeft} footerRight={footerRight} navLinks={navLinks}>
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>{audienceLabel}</span>
        </div>
        <h1 style={heroHeading}>{headline}</h1>
        <p style={heroCopy}>{subheadline}</p>
        <p style={heroBody}>{intro}</p>
        <div style={actionWrap}>
          {actionLinks.map((action) => (
            <Link
              key={action.href}
              className={action.primary ? "button primary" : "button secondary"}
              href={action.href}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-wrap">
        <div style={benefitGrid}>
          {benefits.map((benefit) => (
            <article className="card tagg-card" key={benefit.title} style={benefitCard}>
              <h2 style={benefitTitle}>{benefit.title}</h2>
              <p style={benefitCopy}>{benefit.copy}</p>
            </article>
          ))}
        </div>

        <section className="card tagg-card tagg-card-feature" style={proofPanel}>
          <div className="dashboard-kicker">Why this page exists</div>
          <h2 style={sectionHeading}>Built for the exact search intent behind this page.</h2>
          <div style={proofGrid}>
            {proofPoints.map((point) => (
              <div key={point.label} style={proofItem}>
                <div style={proofLabel}>{point.label}</div>
                <div style={proofCopy}>{point.copy}</div>
              </div>
            ))}
          </div>
        </section>

        {sections?.length ? (
          <div style={{ display: "grid", gap: 16 }}>
            {sections.map((section) => (
              <article className="card tagg-card" key={section.heading} style={sectionCard}>
                <h2 style={sectionHeadingStyle}>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} style={sectionCopy}>
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>
        ) : null}

        <section className="card tagg-card" style={relatedPanel}>
          <div className="dashboard-kicker">Related pages</div>
          <h2 style={sectionHeading}>Keep exploring the CapturePass funnel.</h2>
          <div style={relatedLinksWrap}>
            {relatedLinks.map((link) => (
              <Link key={link.href} className="button secondary" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </Shell>
  );
}

const heroHeading = {
  maxWidth: 1080,
  margin: "28px auto 18px",
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "clamp(56px, 7.4vw, 96px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em"
};

const heroCopy = {
  maxWidth: 820,
  margin: "0 auto",
  color: "#b6bcc8",
  fontSize: 20,
  lineHeight: 1.62,
  fontWeight: 500
};

const heroBody = {
  maxWidth: 780,
  margin: "18px auto 0",
  color: "#e5e7eb",
  fontSize: 16,
  lineHeight: 1.64,
  fontWeight: 500
};

const actionWrap = {
  marginTop: 34,
  display: "flex",
  justifyContent: "center",
  gap: 14,
  flexWrap: "wrap" as const
};

const benefitGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 16
};

const benefitCard = {
  padding: 24,
  minHeight: 188
};

const benefitTitle = {
  margin: "0 0 10px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(28px, 3vw, 36px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const benefitCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 500
};

const proofPanel = {
  marginTop: 18,
  display: "grid",
  gap: 18,
  padding: "clamp(24px, 5vw, 36px)"
};

const sectionHeading = {
  margin: "0 0 12px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  fontWeight: 800
};

const proofGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 14
};

const proofItem = {
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(var(--brand-deep-rgb),.22)",
  background: "rgba(255,255,255,.022)"
};

const proofLabel = {
  marginBottom: 8,
  color: "var(--brand-gold)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const proofCopy = {
  color: "#e5e7eb",
  fontSize: 15,
  lineHeight: 1.55,
  fontWeight: 500
};

const sectionCard = {
  padding: 24
};

const sectionHeadingStyle = {
  margin: "0 0 10px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(28px, 3vw, 38px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const sectionCopy = {
  margin: "0 0 12px",
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.62,
  fontWeight: 500
};

const relatedPanel = {
  marginTop: 18,
  padding: "clamp(24px, 5vw, 36px)"
};

const relatedLinksWrap = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12
};
