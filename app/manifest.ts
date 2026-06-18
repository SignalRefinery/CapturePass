import type { MetadataRoute } from "next";
import { appUrl, fullDescription, productName } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: productName,
    short_name: productName,
    description: fullDescription,
    start_url: appUrl,
    scope: appUrl,
    display: "standalone",
    background_color: "#FAFBFC",
    theme_color: "#0B5FFF",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ],
    categories: ["business", "productivity", "social"],
    id: appUrl,
    prefer_related_applications: false,
    related_applications: [],
    shortcuts: []
  };
}
