import type { Metadata } from "next";
import {
  appUrl,
  fullBrandName,
  fullDescription,
  productName,
  tagline
} from "@/lib/brand";

export const SITE_NAME = productName;
export const SITE_TAGLINE = tagline;
export const SITE_DESCRIPTION = fullDescription;
export const SITE_URL = appUrl;
export const DEFAULT_OG_IMAGE = "/opengraph-image";
export const DEFAULT_TWITTER_IMAGE = "/twitter-image";

type PageMetadataInput = {
  description: string;
  path: string;
  title: string;
  image?: string;
};

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildPageMetadata({
  description,
  path,
  title,
  image = DEFAULT_OG_IMAGE
}: PageMetadataInput): Metadata {
  const ogImage = `${image}${image.includes("?") ? "&" : "?"}title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}`;
  const twitterImage = `${DEFAULT_TWITTER_IMAGE}?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}`;
  const canonicalUrl = absoluteUrl(path);

  return {
    alternates: {
      canonical: canonicalUrl
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: title,
          height: 630,
          url: ogImage,
          width: 1200
        }
      ],
      siteName: SITE_NAME,
      title,
      type: "website",
      url: canonicalUrl
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [twitterImage],
      title
    }
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: fullBrandName,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/icon"),
    sameAs: []
  };
}

export function buildSoftwareApplicationJsonLd(input: {
  description: string;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "BusinessApplication",
    description: input.description,
    name: input.name,
    operatingSystem: "Web",
    url: absoluteUrl(input.path)
  };
}

export function buildProductJsonLd(input: {
  description: string;
  name: string;
  path: string;
  price: string;
  priceCurrency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    description: input.description,
    name: input.name,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: input.price,
      priceCurrency: input.priceCurrency || "USD",
      url: absoluteUrl(input.path)
    },
    url: absoluteUrl(input.path)
  };
}

export function buildFaqJsonLd(items: Array<{ answer: string; question: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function buildLocalBusinessJsonLd(input: {
  description: string;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    description: input.description,
    name: input.name,
    url: absoluteUrl(input.path)
  };
}

export function buildArticleJsonLd(input: {
  author?: string;
  description: string;
  headline: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    author: {
      "@type": "Organization",
      name: input.author || fullBrandName
    },
    description: input.description,
    headline: input.headline,
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path)
  };
}
