import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, buildPageMetadata } from "@/lib/seo";
import { RESOURCE_CATEGORIES, getResourcesForCategory } from "@/lib/marketing-content";

const categoryInfo = Object.fromEntries(RESOURCE_CATEGORIES.map((item) => [item.key, item])) as Record<
  (typeof RESOURCE_CATEGORIES)[number]["key"],
  (typeof RESOURCE_CATEGORIES)[number]
>;

export function generateStaticParams() {
  return RESOURCE_CATEGORIES.map((category) => ({ category: category.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const info = categoryInfo[category as keyof typeof categoryInfo];
  if (!info) return {};

  return buildPageMetadata({
    description: info.description,
    path: `/resources/category/${category}`,
    title: `${info.label} Resources`
  });
}

export default async function ResourceCategoryPage({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const info = categoryInfo[category as keyof typeof categoryInfo];
  if (!info) notFound();

  const articles = getResourcesForCategory(info.key);

  return (
    <Shell
      footerLeft={`${info.label} Resources`}
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/resources", label: "Resources" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/business", label: "Business" }
      ]}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          description: info.description,
          name: `${info.label} Resources`,
          url: new URL(`/resources/category/${category}`, SITE_URL).toString()
        }}
      />

      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>{info.label} Resources</span>
        </div>
        <h1 style={heading}>{info.label} guides and workflows.</h1>
        <p style={intro}>{info.description}</p>
      </section>

      <section className="section-wrap">
        <div style={grid}>
          {articles.map((article) => (
            <article className="card tagg-card" key={article.href} style={card}>
              <h2 style={cardHeading}>{article.title}</h2>
              <p style={cardCopy}>{article.excerpt}</p>
              <Link className="button primary" href={article.href} style={{ marginTop: 16, width: "fit-content" }}>
                Read guide
              </Link>
            </article>
          ))}
        </div>

        <section className="card tagg-card" style={relatedPanel}>
          <div className="dashboard-kicker">Browse more</div>
          <div style={relatedLinks}>
            <Link className="button secondary" href="/resources">
              Resource center
            </Link>
            <Link className="button secondary" href="/business/pricing">
              Business Pricing
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              Contact Capture
            </Link>
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
  fontSize: "clamp(56px, 7vw, 96px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em"
};

const intro = {
  maxWidth: 820,
  margin: "0 auto",
  color: "#5f6674",
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
  color: "#5f6674",
  fontSize: 16,
  lineHeight: 1.6,
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
