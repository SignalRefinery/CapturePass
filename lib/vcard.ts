type VcardContact = {
  fullName?: string | null;
  organizationName?: string | null;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  profileUrl?: string | null;
  note?: string | null;
};

function cleanValue(value?: string | null) {
  const trimmed = (value || "").trim();
  return trimmed.length ? trimmed : "";
}

function escapeComponent(value?: string | null) {
  return cleanValue(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function cleanPhone(value?: string | null) {
  return cleanValue(value).replace(/[^0-9+]/g, "");
}

function safeSegment(value?: string | null) {
  return cleanValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildNameComponents(fullName: string) {
  const normalized = cleanValue(fullName);
  if (!normalized) {
    return ";;;;";
  }

  const commaParts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const family = commaParts[0] || "";
    const givenParts = commaParts[1].split(/\s+/).filter(Boolean);
    const given = givenParts.shift() || "";
    const additional = [...givenParts, ...commaParts.slice(2)].join(" ").trim();
    return `${escapeComponent(family)};${escapeComponent(given)};${escapeComponent(additional)};;`;
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return `;${escapeComponent(parts[0])};;;`;
  }

  const given = parts[0] || "";
  const family = parts[parts.length - 1] || "";
  const additional = parts.slice(1, -1).join(" ");
  return `${escapeComponent(family)};${escapeComponent(given)};${escapeComponent(additional)};;`;
}

export function buildVcardFilename(value?: string | null) {
  const safeValue = safeSegment(value) || "capturepass-contact";
  return `${safeValue}.vcf`;
}

export function buildProfileVcardUrl(slug?: string | null) {
  const safeSlug = safeSegment(slug);
  return safeSlug ? `/api/vcard/${encodeURIComponent(safeSlug)}` : "";
}

export function buildPassVcardUrl(token?: string | null) {
  const safeToken = cleanValue(token);
  return safeToken ? `/api/pass-vcard/${encodeURIComponent(safeToken)}` : "";
}

export function isCanonicalVcardUrl(value?: string | null) {
  const cleaned = cleanValue(value);
  if (!cleaned || cleaned.toLowerCase().endsWith(".txt")) {
    return false;
  }

  try {
    const parsed = new URL(cleaned, "https://capturepass.local");
    return /^\/api\/(pass-)?vcard\/[^/]+$/i.test(parsed.pathname);
  } catch {
    return /^\/api\/(pass-)?vcard\/[^/]+$/i.test(cleaned);
  }
}

export function resolveProfileVcardUrl(profile: { slug?: string | null; vcard_url?: string | null }) {
  if (isCanonicalVcardUrl(profile.vcard_url)) {
    return profile.vcard_url || "";
  }

  return buildProfileVcardUrl(profile.slug);
}

export function resolvePassVcardUrl(profile: { vcard_url?: string | null }, token?: string | null) {
  if (isCanonicalVcardUrl(profile.vcard_url)) {
    return profile.vcard_url || "";
  }

  return buildPassVcardUrl(token);
}

export function buildVcardText(contact: VcardContact) {
  const fullName = cleanValue(contact.fullName) || cleanValue(contact.organizationName) || "CapturePass Contact";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeComponent(fullName)}`,
    `N:${buildNameComponents(fullName)}`,
    contact.organizationName ? `ORG:${escapeComponent(contact.organizationName)}` : "",
    contact.title ? `TITLE:${escapeComponent(contact.title)}` : "",
    contact.email ? `EMAIL;TYPE=INTERNET:${escapeComponent(contact.email)}` : "",
    contact.phone ? `TEL;TYPE=CELL:${escapeComponent(cleanPhone(contact.phone))}` : "",
    contact.websiteUrl ? `URL:${escapeComponent(contact.websiteUrl)}` : "",
    contact.profileUrl && contact.profileUrl !== contact.websiteUrl
      ? `URL:${escapeComponent(contact.profileUrl)}`
      : "",
    contact.note ? `NOTE:${escapeComponent(contact.note)}` : "",
    "END:VCARD"
  ].filter(Boolean);

  return `${lines.join("\r\n")}\r\n`;
}

export function buildVcardResponseHeaders(filename: string) {
  return {
    "Content-Type": "text/vcard; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "X-Content-Type-Options": "nosniff"
  };
}
