const DEFAULT_QR_FILENAME_BASE = "capturepass-profile";

export function buildQuickChartQrUrl(targetUrl?: string | null) {
  if (!targetUrl) return null;
  return `https://quickchart.io/qr?text=${encodeURIComponent(targetUrl)}&size=600`;
}

export function buildQrFilenameBase(identifier?: string | null, fallback = DEFAULT_QR_FILENAME_BASE) {
  const safeIdentifier = (identifier || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeIdentifier || fallback;
}

export function buildQrPngAttachment(targetUrl?: string | null, identifier?: string | null) {
  const path = buildQuickChartQrUrl(targetUrl);
  if (!path) return null;

  return {
    path,
    filename: `${buildQrFilenameBase(identifier)}-qr.png`
  };
}
