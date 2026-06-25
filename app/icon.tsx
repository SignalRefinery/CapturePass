import { ImageResponse } from "next/og";
import { getBrandAssetDataUrl } from "@/lib/brand-assets.server";

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
          style={{ display: "block", height: 26, width: "auto" }}
        />
      </div>
    ),
    size
  );
}
