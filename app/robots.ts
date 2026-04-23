import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://signalpass.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/how-it-works", "/partners", "/login", "/signup", "/privacy", "/terms"],
      disallow: ["/admin", "/dashboard", "/api/"]
    },
    sitemap: `${appUrl}/sitemap.xml`
  };
}
