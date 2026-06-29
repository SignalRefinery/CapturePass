import Image from "next/image";
import { BRAND_ASSETS, type BrandAssetKey } from "@/lib/brand-assets";

const BRAND_ASSET_SIZES: Record<
  BrandAssetKey,
  {
    height: number;
    maxWidth: number;
    width: number;
  }
> = {
  logoMark: {
    width: 837,
    height: 439,
    maxWidth: 128
  },
  logoLockup: {
    width: 1111,
    height: 265,
    maxWidth: 248
  },
  logoLockupWithTagline: {
    width: 1096,
    height: 266,
    maxWidth: 280
  },
  wordmark: {
    width: 883,
    height: 220,
    maxWidth: 176
  }
};

export function CapturePassBrandArt({
  alt = "CapturePass",
  className,
  priority = false,
  variant
}: {
  alt?: string;
  className?: string;
  priority?: boolean;
  variant: BrandAssetKey;
}) {
  const size = BRAND_ASSET_SIZES[variant];
  const aspectRatio = `${size.width} / ${size.height}`;

  return (
    <span
      style={{
        display: "inline-block",
        width: `${size.maxWidth}px`,
        maxWidth: `${size.maxWidth}px`,
        aspectRatio,
        position: "relative",
        overflow: "hidden",
        lineHeight: 0,
        flexShrink: 0
      }}
    >
      <Image
        className={className}
        src={BRAND_ASSETS[variant]}
        alt={alt}
        draggable={false}
        priority={priority}
        sizes={`(max-width: 640px) ${Math.min(size.maxWidth, 180)}px, ${size.maxWidth}px`}
        fill
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain"
        }}
      />
    </span>
  );
}
