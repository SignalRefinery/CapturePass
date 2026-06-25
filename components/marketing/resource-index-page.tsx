import Link from "next/link";
import { Shell } from "@/components/shared/shell";

type ResourceIndexPageProps = {
  categories: Array<{
    description: string;
    href: string;
    label: string;
  }>;
  featuredArticles: Array<{
    description: string;
    href: string;
    title: string;
  }>;
  localLinks?: Array<{
    href: string;
    label: string;
  }>;
};

export function ResourceIndexPage({ categories, featuredArticles, localLinks }: ResourceIndexPageProps) {
  return (
    <Shell
      footerLeft="Resources"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" }
      ]}
    >
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Resource Center</span>
        </div>
        <h1 style={heading}>CapturePass resources for smarter sharing and better follow-up.</h1>
        <p style={intro}>
          Learn how contact capture, NFC cards, and digital business cards work across industries, then connect
          those ideas back to the right CapturePass product page.
        </p>
      </section>

      <section className="section-wrap">
        <div style={grid}>
          {categories.map((category) => (
            <article className="card tagg-card" key={category.href} style={card}>
              <h2 style={cardHeading}>{category.label}</h2>
              <p style={cardCopy}>{category.description}</p>
              <Link className="button secondary" href={category.href} style={{ marginTop: 16, width: "fit-content" }}>
                View category
              </Link>
            </article>
          ))}
        </div>

        <section className="card tagg-card tagg-card-feature" style={featurePanel}>
          <div className="dashboard-kicker">Featured guides</div>
          <div style={articleGrid}>
            {featuredArticles.map((article) => (
              <article key={article.href} style={articleCard}>
                <h3 style={articleHeading}>{article.title}</h3>
                <p style={articleCopy}>{article.description}</p>
                <Link className="button primary" href={article.href} style={{ width: "fit-content" }}>
                  Read guide
                </Link>
              </article>
            ))}
          </div>
        </section>

        {localLinks?.length ? (
          <section className="card tagg-card" style={featurePanel}>
            <div className="dashboard-kicker">Springfield, Illinois</div>
            <h2 style={cardHeading}>Local SEO pages for Springfield searchers.</h2>
            <div style={linkWrap}>
              {localLinks.map((link) => (
                <Link key={link.href} className="button secondary" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </Shell>
  );
}

const heading = {
  maxWidth: 1080,
  margin: "28px auto 18px",
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "clamp(56px, 7vw, 96px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em"
};

const intro = {
  maxWidth: 780,
  margin: "0 auto",
  color: "#b6bcc8",
  fontSize: "clamp(18px, 2vw, 21px)",
  lineHeight: 1.62,
  fontWeight: 500
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 16
};

const card = {
  padding: 24
};

const cardHeading = {
  margin: "0 0 10px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(28px, 3vw, 38px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const cardCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 500
};

const featurePanel = {
  marginTop: 18,
  padding: "clamp(24px, 5vw, 36px)"
};

const articleGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: 16
};

const articleCard = {
  display: "grid",
  gap: 14,
  padding: 22,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.025)"
};

const articleHeading = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(24px, 2.8vw, 32px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const articleCopy = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 500
};

const linkWrap = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12
};
