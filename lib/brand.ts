export type BrandConfig = {
  appUrl: string;
  category: string;
  companyCategory: string;
  companyName: string;
  domain: string;
  fullBrandName: string;
  fullDescription: string;
  productName: string;
  seoCategory: string;
  shortDescription: string;
  supportEmail: string;
  tagline: string;
};

export const brand = {
  productName: "CapturePass",
  companyName: "HandshakeIQ",
  fullBrandName: "CapturePass by HandshakeIQ",
  tagline: "Turn Every Handshake Into a Prospect.",
  shortDescription: "Contact capture platform for professionals and teams.",
  fullDescription:
    "CapturePass helps professionals and teams capture contacts, share information instantly, and turn every handshake into a trackable business opportunity.",
  domain: "capturepass.com",
  appUrl: "https://capturepass.com",
  supportEmail: "support@capturepass.com",
  category: "Contact Capture Platform",
  seoCategory: "Digital Business Cards",
  companyCategory: "Relationship Intelligence"
} as const satisfies BrandConfig;

export const {
  productName,
  companyName,
  fullBrandName,
  tagline,
  shortDescription,
  fullDescription,
  domain,
  appUrl,
  supportEmail,
  category,
  seoCategory,
  companyCategory
} = brand;
