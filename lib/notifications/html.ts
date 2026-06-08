export function escapeEmailHtml(value?: string | null) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatShippingAddressHtml(parts: Array<string | null | undefined>) {
  const cleanParts = parts.filter(Boolean) as string[];

  if (!cleanParts.length) {
    return "<em>Shipping address not yet collected.</em>";
  }

  return cleanParts.map((part) => escapeEmailHtml(part)).join("<br />");
}
