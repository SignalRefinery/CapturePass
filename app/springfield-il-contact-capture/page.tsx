import { JsonLd } from "@/components/seo/json-ld";
import { SpringfieldPage } from "@/components/marketing/springfield-page";
import { buildOrganizationJsonLd, buildPageMetadata, buildSoftwareApplicationJsonLd } from "@/lib/seo";
import { getSpringfieldPage } from "@/lib/marketing-content";

const page = getSpringfieldPage("springfield-il-contact-capture");

export const metadata = buildPageMetadata({
  description: page?.description || "",
  path: "/springfield-il-contact-capture",
  title: page?.title || "Springfield Contact Capture"
});

export default function SpringfieldContactCapturePage() {
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
          { href: "/contact-capture-nfc-cards", label: "Contact Capture" },
          { href: "/business/pricing", label: "Business Pricing" }
        ]}
        page={page}
      />
    </>
  );
}
