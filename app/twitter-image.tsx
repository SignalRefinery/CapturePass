import { ImageResponse } from "next/og";
import { getSocialImageData } from "@/lib/social-image";
import { designTokens } from "@/lib/design-tokens";
import { getBrandAssetDataUrl } from "@/lib/brand-assets.server";

export const size = {
  width: 1600,
  height: 900
};

export const contentType = "image/png";

export default function TwitterImage({
  searchParams
}: {
  searchParams?: {
    subtitle?: string;
    title?: string;
  };
}) {
  const { title, subtitle } = getSocialImageData("/", searchParams);

  return new ImageResponse(
    (
      <div
          style={{
            alignItems: "flex-end",
            background:
            `linear-gradient(135deg, rgba(8,8,10,.96), rgba(${designTokens.rgb.charcoal},.96)), radial-gradient(circle at 20% 20%, rgba(${designTokens.rgb.deepBlue},.3), transparent 32%), radial-gradient(circle at 80% 20%, rgba(${designTokens.rgb.primary},.18), transparent 30%)`,
          color: designTokens.colors.white,
          display: "flex",
          fontFamily: "Inter, system-ui, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1180 }}>
          <div
            style={{
              alignItems: "center",
              color: designTokens.colors.insightGold,
              display: "flex",
              gap: 12,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase"
            }}
          >
            <img
              src={getBrandAssetDataUrl("logoLockup")}
              alt="CapturePass"
              width="440"
              height="293"
              style={{ display: "block", height: 50, width: "auto" }}
            />
          </div>
          <div style={{ fontSize: 94, fontWeight: 800, lineHeight: 0.93, letterSpacing: "-0.05em" }}>
            {title}
          </div>
          <div style={{ color: "#cbd5e1", fontSize: 36, lineHeight: 1.25, maxWidth: 980 }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            color: designTokens.colors.white,
            fontSize: 24,
            fontWeight: 700,
            opacity: 0.92
          }}
        >
          Turn Every Handshake Into a Prospect.
        </div>
      </div>
    ),
    size
  );
}
