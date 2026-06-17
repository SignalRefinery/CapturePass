import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { ResourceArticlePage } from "@/components/marketing/resource-article-page";
import { buildArticleJsonLd, buildPageMetadata } from "@/lib/seo";
import { getResourceArticle, RESOURCE_ARTICLES } from "@/lib/marketing-content";

export function generateStaticParams() {
  return RESOURCE_ARTICLES.map((article) => ({
    slug: article.href.split("/").pop() as string
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getResourceArticle(slug);
  if (!article) return {};

  return buildPageMetadata({
    description: article.description,
    path: article.href,
    title: article.title
  });
}

export default async function ResourceArticlePageRoute({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getResourceArticle(slug);
  if (!article) notFound();

  return (
    <>
      <JsonLd data={buildArticleJsonLd({
        description: article.description,
        headline: article.title,
        path: article.href
      })} />
      <ResourceArticlePage
        article={{
          description: article.description,
          excerpt: article.excerpt,
          intro: article.intro,
          relatedLinks: article.relatedLinks,
          sections: article.sections,
          title: article.title
        }}
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { href: "/pricing", label: "Pricing" },
          { href: "/business", label: "Business" }
        ]}
      />
    </>
  );
}

