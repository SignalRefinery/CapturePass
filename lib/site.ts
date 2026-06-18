import { appUrl, fullDescription, productName } from "@/lib/brand";

export const site = {
  name: productName,
  url: appUrl,
  description: fullDescription
} as const;
