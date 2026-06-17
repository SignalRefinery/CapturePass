import { JsonLd } from "@/components/seo/json-ld";
import { SpringfieldPage } from "@/components/marketing/springfield-page";
import { buildOrganizationJsonLd, buildPageMetadata, buildSoftwareApplicationJsonLd } from "@/lib/seo";
import { getSpringfieldPage } from "@/lib/marketing-content";

const page = getSpringfieldPage("springfield-il-nfc-business-cards");

export const metadata = buildPageMetadata({
  description: page?.description || "",
  path: "/springfield-il-nfc-business-cards",
  title: page?.title || "Springfield NFC Business Cards"
});

export default function SpringfieldNfcBusinessCardsPage() {
  if (!page) return null;

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildSoftwareApplicationJsonLd({
        description: page.description,
        name: page.title,
        path: page.href
      })} />
      <SpringfieldPage
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { href: "/business", label: "Business" },
          { href: "/pricing", label: "Pricing" }
        ]}
        page={page}
      />
    </>
  );
}

