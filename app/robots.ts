import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/how-it-works", "/partners", "/login", "/signup", "/privacy", "/terms"],
        // TapTagg profiles are direct-share destinations, not discovery
        // inventory. Disallow token/vCard/admin surfaces from crawler traversal.
        disallow: ["/admin", "/account", "/dashboard", "/api/", "/u/", "/auth/"]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`
  };
}
