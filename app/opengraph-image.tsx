import { ImageResponse } from "next/og";
import { getSocialImageData } from "@/lib/social-image";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage({
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
          alignItems: "center",
          background:
            "radial-gradient(circle at 20% 15%, rgba(167,139,250,.38), transparent 30%), radial-gradient(circle at 80% 22%, rgba(79,70,229,.28), transparent 28%), linear-gradient(135deg, #050506 0%, #0b0b11 55%, #120a20 100%)",
          color: "#fff",
          display: "flex",
          fontFamily: "Inter, system-ui, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 860 }}>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase"
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                borderRadius: 16,
                display: "flex",
                fontSize: 28,
                height: 56,
                justifyContent: "center",
                width: 56
              }}
            >
              TT
            </div>
            <span style={{ fontSize: 24, fontWeight: 800 }}>TapTagg</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 0.94, letterSpacing: "-0.05em" }}>
              {title}
            </div>
            <div style={{ color: "#d8ccff", fontSize: 30, fontWeight: 600, lineHeight: 1.25, maxWidth: 780 }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            alignSelf: "flex-end",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 28,
            color: "#d8ccff",
            fontSize: 22,
            fontWeight: 700,
            padding: "18px 22px"
          }}
        >
          Play Tagg Everywhere.
        </div>
      </div>
    ),
    size
  );
}
