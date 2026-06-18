import { ImageResponse } from "next/og";
import { CapturePassMark } from "@/components/shared/capturepass-mark";
import { designTokens } from "@/lib/design-tokens";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: designTokens.colors.charcoal,
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
            borderRadius: 10,
            boxShadow: `0 0 0 1px rgba(${designTokens.rgb.white},.08) inset`,
            display: "flex",
            height: 26,
            justifyContent: "center",
            width: 26
          }}
        >
          <CapturePassMark />
        </div>
      </div>
    ),
    size
  );
}
