import { getBrandAssetUrl } from "@/lib/brand-assets";

export function buildEmailBrandHeaderHtml(variant: "logoLockup" | "logoLockupWithTagline" = "logoLockupWithTagline") {
  const src = getBrandAssetUrl(variant);
  const width = variant === "logoLockupWithTagline" ? 560 : 440;

  return `
    <p style="margin:0 0 20px;">
      <img src="${src}" alt="CapturePass" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;" />
    </p>
  `;
}
