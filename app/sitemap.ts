import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://signalpass.app";

  const routes = [
    "",
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
