import fs from "node:fs";
import path from "node:path";
import { type BrandAssetKey } from "@/lib/brand-assets";

const BRAND_ASSET_FILES: Record<BrandAssetKey, string> = {
  logoMark: "CapturePass Logo.png",
  logoLockup: "Capturepass Logo with Wordmark.png",
  logoLockupWithTagline: "Capturepass Logo with Wordmark and Tagline.png",
  wordmark: "CapturePass Wordmark.png"
};

export function getBrandAssetDataUrl(key: BrandAssetKey) {
  const filePath = path.join(process.cwd(), "public", "brand", BRAND_ASSET_FILES[key]);
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:image/png;base64,${base64}`;
}
