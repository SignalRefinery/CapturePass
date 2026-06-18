import { ImageResponse } from "next/og";
import { CapturePassMark } from "@/components/shared/capturepass-mark";
import { designTokens } from "@/lib/design-tokens";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            `radial-gradient(circle at 30% 28%, rgba(${designTokens.rgb.primary},.24), transparent 28%), linear-gradient(135deg, ${designTokens.colors.charcoal}, #080a12)`,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: `linear-gradient(135deg, ${designTokens.colors.primary}, ${designTokens.colors.deepBlue})`,
            borderRadius: 42,
            boxShadow: "0 18px 42px rgba(0,0,0,.34)",
            display: "flex",
            height: 126,
            justifyContent: "center",
            width: 126
          }}
        >
          <CapturePassMark />
        </div>
      </div>
    ),
    size
  );
}
