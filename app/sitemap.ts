import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app";

  // Keep this list marketing-only. Public profiles and token URLs are
  // intentional direct-share destinations and must not be discoverable here.
  const routes = [
    "",
    "/business",
    "/business-individual",
    "/business/pricing",
    "/contact-capture-nfc-cards",
    "/taptagg-vs-popl",
    "/dealerships",
    "/insurance-agents",
    "/real-estate-agents",
    "/sales-teams",
    "/pricing",
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
