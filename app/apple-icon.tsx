import { ImageResponse } from "next/og";
import { getBrandAssetDataUrl } from "@/lib/brand-assets.server";

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
          background: "#0f172a",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <img
          src={getBrandAssetDataUrl("logoMark")}
          alt="CapturePass"
          width="1536"
          height="1024"
          style={{ display: "block", height: 126, width: "auto" }}
        />
      </div>
    ),
    size
  );
}
