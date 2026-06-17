import Link from "next/link";
import { Shell } from "@/components/shared/shell";

type SpringfieldPageProps = {
  page: {
    description: string;
    href: string;
    intro: string;
    relatedLinks: Array<{ href: string; label: string }>;
    sections: Array<{ heading: string; paragraphs: string[] }>;
    title: string;
  };
  navLinks: Array<{ href: string; label: string }>;
};

export function SpringfieldPage({ navLinks, page }: SpringfieldPageProps) {
  return (
    <Shell footerLeft="Springfield, Illinois" footerRight="TapTagg" navLinks={navLinks}>
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Springfield, Illinois</span>
        </div>
        <h1 style={heading}>{page.title}</h1>
        <p style={intro}>{page.description}</p>
        <p style={body}>{page.intro}</p>
      </section>

      <section className="section-wrap">
        <div style={grid}>
          {page.sections.map((section) => (
            <article className="card tagg-card" key={section.heading} style={card}>
              <h2 style={sectionHeading}>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} style={paragraphStyle}>
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>

        <section className="card tagg-card tagg-card-feature" style={relatedPanel}>
          <div className="dashboard-kicker">Related pages</div>
          <div style={relatedLinks}>
            {page.relatedLinks.map((link) => (
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

const heading = {
  maxWidth: 1080,
  margin: "28px auto 18px",
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "clamp(52px, 7.4vw, 96px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em"
};

const intro = {
  maxWidth: 820,
  margin: "0 auto",
  color: "#b6bcc8",
  fontSize: "clamp(18px, 2vw, 21px)",
  lineHeight: 1.62,
  fontWeight: 500
};

const body = {
  maxWidth: 780,
  margin: "18px auto 0",
  color: "#e5e7eb",
  fontSize: 16,
  lineHeight: 1.64,
  fontWeight: 500
};

const grid = {
  display: "grid",
  gap: 16
};

const card = {
  padding: 26
};

const sectionHeading = {
  margin: "0 0 10px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(28px, 3vw, 38px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const paragraphStyle = {
  margin: "0 0 12px",
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 500
};

const relatedPanel = {
  marginTop: 18,
  padding: "clamp(24px, 5vw, 36px)"
};

const relatedLinks = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12
};

