import { ImageResponse } from "next/og";
import { getSocialImageData } from "@/lib/social-image";

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
            "linear-gradient(135deg, rgba(8,8,10,.96), rgba(15,10,26,.96)), radial-gradient(circle at 20% 20%, rgba(167,139,250,.3), transparent 32%), radial-gradient(circle at 80% 20%, rgba(79,70,229,.18), transparent 30%)",
          color: "#fff",
          display: "flex",
          fontFamily: "Inter, system-ui, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1180 }}>
          <div style={{ color: "#d8ccff", fontSize: 28, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          TapTagg
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
            color: "#fff",
            fontSize: 24,
            fontWeight: 700,
            opacity: 0.92
          }}
        >
          Play Tagg Everywhere.
        </div>
      </div>
    ),
    size
  );
}
