import type { Metadata } from "next";

export const SITE_NAME = "TapTagg";
export const SITE_TAGLINE = "Play Tagg Everywhere.";
export const SITE_DESCRIPTION =
  "TapTagg helps people and teams share profiles, contact details, and links instantly with NFC cards, QR codes, and contact capture.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app";
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

  return {
    alternates: {
      canonical: path
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
      url: absoluteUrl(path)
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
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/custom-taptagg-card.jpg"),
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
      name: input.author || SITE_NAME
    },
    description: input.description,
    headline: input.headline,
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path)
  };
}
