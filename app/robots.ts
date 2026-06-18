import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capturepass.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/how-it-works",
          "/partners",
          "/business",
          "/business/pricing",
          "/business-individual",
          "/contact",
          "/contact-capture-nfc-cards",
          "/dealerships",
          "/insurance-agents",
          "/real-estate-agents",
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
          "/springfield-il-nfc-business-cards",
          "/springfield-il-digital-business-cards",
          "/springfield-il-contact-capture",
          "/springfield-il-sales-team-business-cards",
          "/sales-teams",
          "/login",
          "/signup",
          "/privacy",
          "/terms"
        ],
        // CapturePass direct-share and private surfaces are not discovery
        // inventory. Public readable profiles stay crawlable through metadata.
        disallow: ["/admin", "/account", "/dashboard", "/api/", "/u/", "/p/", "/pass/", "/auth/"]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`
  };
}
