import { JsonLd } from "@/components/seo/json-ld";
import { ResourceIndexPage } from "@/components/marketing/resource-index-page";
import { buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";
import { RESOURCE_ARTICLES, RESOURCE_CATEGORIES } from "@/lib/marketing-content";

export const metadata = buildPageMetadata({
  description:
    "CapturePass’s resource center covers NFC business cards, contact capture, digital cards, and industry workflows for sales, dealerships, insurance, and real estate.",
  path: "/resources",
  title: "Resources"
});

const featuredArticles = RESOURCE_ARTICLES.slice(0, 4).map((article) => ({
  description: article.description,
  href: article.href,
  title: article.title
}));

export default function ResourcesPage() {
  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <ResourceIndexPage
        categories={RESOURCE_CATEGORIES as unknown as Array<{ description: string; href: string; label: string }>}
        featuredArticles={featuredArticles}
        localLinks={[
          { href: "/springfield-il-nfc-business-cards", label: "Springfield NFC Business Cards" },
          { href: "/springfield-il-digital-business-cards", label: "Springfield Digital Business Cards" },
          { href: "/springfield-il-contact-capture", label: "Springfield Contact Capture" },
          { href: "/springfield-il-sales-team-business-cards", label: "Springfield Sales Team Cards" }
        ]}
      />
    </>
  );
}
