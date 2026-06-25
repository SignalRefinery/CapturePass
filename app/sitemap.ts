import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capturepass.com";

  // Keep this list marketing-only. Public profile pages are indexed through
  // per-page metadata, while direct-share token URLs and private surfaces stay
  // out of the sitemap entirely.
  const routes = [
    "",
    "/business",
    "/business-individual",
    "/business/pricing",
    "/contact",
    "/contact-capture-nfc-cards",
    "/dealerships",
    "/insurance-agents",
    "/real-estate-agents",
    "/sales-teams",
    "/resources",
    "/resources/category/dealerships",
    "/resources/category/insurance",
    "/resources/category/real-estate",
    "/resources/category/sales",
    "/resources/how-nfc-business-cards-work",
    "/resources/contact-capture-vs-traditional-business-cards",
    "/resources/digital-business-cards-for-sales-teams",
    "/resources/why-businesses-lose-leads-after-networking-events",
    "/resources/nfc-business-cards-for-car-dealerships",
    "/resources/digital-business-cards-for-insurance-agents",
    "/resources/nfc-business-cards-for-realtors",
    "/capturepass-vs-popl",
    "/best-digital-business-card-for-sales-teams",
    "/best-digital-business-card-for-insurance-agents",
    "/best-digital-business-card-for-real-estate-agents",
    "/best-nfc-business-card-for-car-dealerships",
    "/springfield-il-nfc-business-cards",
    "/springfield-il-digital-business-cards",
    "/springfield-il-contact-capture",
    "/springfield-il-sales-team-business-cards",
    "/how-it-works",
    "/partners",
    "/login",
    "/signup",
    "/privacy",
    "/terms"
  ];

  return routes.map((route) => ({
    url: `${appUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6
  }));
}
