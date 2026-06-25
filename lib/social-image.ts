import { RESOURCE_ARTICLES, RESOURCE_CATEGORIES, SPRINGFIELD_PAGES } from "@/lib/marketing-content";

export type SocialImageData = {
  subtitle: string;
  title: string;
};

const STATIC_TITLES: Record<string, SocialImageData> = {
  "/": { title: "CapturePass", subtitle: "Turn Every Handshake Into a Prospect." },
  "/business": { title: "CapturePass for Business", subtitle: "Contact capture, reusable profiles, and lead ownership." },
  "/business-individual": { title: "Business Individual", subtitle: "Launch offer for solo professionals." },
  "/business/pricing": { title: "Business Pricing", subtitle: "Self-managed and managed plans for teams." },
  "/pricing": { title: "CapturePass Business Pricing", subtitle: "Digital sharing, contact capture, and team tools." },
  "/resources": { title: "CapturePass Resources", subtitle: "Guides for NFC cards and lead capture." },
  "/dealerships": { title: "CapturePass for Dealerships", subtitle: "Lead capture and showroom follow-up." },
  "/insurance-agents": { title: "CapturePass for Insurance Agents", subtitle: "Referral networking and long-term follow-up." },
  "/real-estate-agents": { title: "CapturePass for Real Estate Agents", subtitle: "Open houses, listings, and saved contacts." },
  "/sales-teams": { title: "CapturePass for Sales Teams", subtitle: "Lead ownership and team accountability." },
  "/contact-capture-nfc-cards": { title: "Contact Capture NFC Cards", subtitle: "Turn quick meetings into saved contacts." },
  "/springfield-il-nfc-business-cards": { title: "Springfield NFC Business Cards", subtitle: "Local lead capture and follow-up." },
  "/springfield-il-digital-business-cards": { title: "Springfield Digital Business Cards", subtitle: "Easy sharing for Illinois professionals." },
  "/springfield-il-contact-capture": { title: "Springfield Contact Capture", subtitle: "Simple workflow for saved contacts." },
  "/springfield-il-sales-team-business-cards": { title: "Springfield Sales Team Business Cards", subtitle: "Keep the lead attached to the rep." },
  "/capturepass-vs-popl": { title: "CapturePass vs Popl", subtitle: "A focused comparison for sales teams and local businesses." },
  "/contact": { title: "Contact CapturePass", subtitle: "Talk with CapturePass about business cards and lead capture." }
};

export function getSocialImageData(
  pathname: string,
  overrides?: {
    subtitle?: string | null;
    title?: string | null;
  }
): SocialImageData {
  if (overrides?.title || overrides?.subtitle) {
    return {
      subtitle: overrides.subtitle || STATIC_TITLES[pathname]?.subtitle || "Modern contact sharing and lead capture.",
      title: overrides.title || STATIC_TITLES[pathname]?.title || "CapturePass"
    };
  }

  const direct = STATIC_TITLES[pathname];
  if (direct) return direct;

  if (pathname.startsWith("/resources/category/")) {
    const category = pathname.split("/").pop() || "";
    const categoryLabel =
      RESOURCE_CATEGORIES.find((item) => item.key === category)?.label ||
      category
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    return {
      subtitle: `${categoryLabel} guides and workflows.`,
      title: `${categoryLabel} Resources`
    };
  }

  if (pathname.startsWith("/resources/")) {
    const slug = pathname.split("/").pop() || "";
    const article = RESOURCE_ARTICLES.find((item) => item.href.endsWith(`/${slug}`));
    if (article) {
      return {
        subtitle: article.excerpt,
        title: article.title
      };
    }
  }

  const springfieldPage = SPRINGFIELD_PAGES[pathname.replace(/^\//, "")];
  if (springfieldPage) {
    return {
      subtitle: springfieldPage.intro,
      title: springfieldPage.title
    };
  }

  return {
    subtitle: "Modern contact sharing and lead capture.",
    title: "CapturePass"
  };
}
