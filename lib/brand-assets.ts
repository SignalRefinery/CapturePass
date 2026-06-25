import { appUrl } from "@/lib/brand";

export const BRAND_ASSETS = {
  logoMark: "/brand/CapturePass%20Logo.png",
  logoLockup: "/brand/Capturepass%20Logo%20with%20Wordmark.png",
  logoLockupWithTagline: "/brand/Capturepass%20Logo%20with%20Wordmark%20and%20Tagline.png",
  wordmark: "/brand/CapturePass%20Wordmark.png"
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

export function getBrandAssetUrl(key: BrandAssetKey) {
  return new URL(BRAND_ASSETS[key], appUrl).toString();
}
