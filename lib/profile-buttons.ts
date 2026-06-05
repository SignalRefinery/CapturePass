import { normalizeUrl } from "@/lib/utils";

export const PROFILE_BUTTON_TYPES = [
  "website",
  "email",
  "phone",
  "text",
  "booking",
  "directions",
  "pdf",
  "payment",
  "custom"
] as const;

export type ProfileButtonType = (typeof PROFILE_BUTTON_TYPES)[number];

export const PROFILE_BUTTON_TYPE_LABELS: Record<ProfileButtonType, string> = {
  website: "Website",
  email: "Email",
  phone: "Phone",
  text: "Text",
  booking: "Booking",
  directions: "Directions",
  pdf: "PDF",
  payment: "Payment",
  custom: "Custom"
};

export const PROFILE_BUTTON_TYPE_DESCRIPTIONS: Record<ProfileButtonType, string> = {
  website: "Opens a normal external link.",
  email: "Opens an email composer.",
  phone: "Opens a phone dialer.",
  text: "Opens a text message composer.",
  booking: "Opens a booking or scheduling link.",
  directions: "Opens directions in Google Maps.",
  pdf: "Opens a PDF document.",
  payment: "Opens a payment link.",
  custom: "Opens a custom destination."
};

export const PROFILE_BUTTON_TYPE_PLACEHOLDERS: Record<ProfileButtonType, string> = {
  website: "https://example.com",
  email: "you@example.com",
  phone: "5551234567",
  text: "5551234567",
  booking: "https://calendly.com/you",
  directions: "123 Main St, Springfield, IL",
  pdf: "https://example.com/file.pdf",
  payment: "https://example.com/pay",
  custom: "https://example.com"
};

export type ProfileButtonRecordLike = {
  primary_link_1_title?: string | null;
  primary_link_1_url?: string | null;
  primary_link_1_type?: string | null;
  primary_link_2_title?: string | null;
  primary_link_2_url?: string | null;
  primary_link_2_type?: string | null;
  primary_link_3_title?: string | null;
  primary_link_3_url?: string | null;
  primary_link_3_type?: string | null;
  primary_link_4_title?: string | null;
  primary_link_4_url?: string | null;
  primary_link_4_type?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type ProfileButton = {
  title: string;
  type: ProfileButtonType;
  value: string;
  href: string;
  subtitle: string;
};

function digitsOnly(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function phoneHref(value?: string | null) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  return `tel:${digits.length === 10 ? "1" : ""}${digits}`;
}

function textHref(value?: string | null) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  return `sms:${digits.length === 10 ? "1" : ""}${digits}`;
}

function emailHref(value?: string | null) {
  const email = (value || "").trim().replace(/^mailto:/i, "");
  return email ? `mailto:${email}` : "";
}

function directionsHref(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

function externalHref(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  return normalizeUrl(trimmed);
}

export function normalizeProfileButtonType(value?: string | null): ProfileButtonType {
  switch (value) {
    case "website":
    case "email":
    case "phone":
    case "text":
    case "booking":
    case "directions":
    case "pdf":
    case "payment":
    case "custom":
      return value;
    default:
      return "website";
  }
}

export function getProfileButtonTypeLabel(value?: string | null) {
  return PROFILE_BUTTON_TYPE_LABELS[normalizeProfileButtonType(value)];
}

export function inferProfileButtonType(value?: string | null, title?: string | null): ProfileButtonType {
  const normalizedValue = (value || "").trim();
  const normalizedTitle = (title || "").trim().toLowerCase();

  if (/^tel:/i.test(normalizedValue) || normalizedTitle.includes("call") || normalizedTitle.includes("phone")) {
    return "phone";
  }

  if (/^sms:/i.test(normalizedValue) || normalizedTitle.includes("text") || normalizedTitle.includes("message")) {
    return "text";
  }

  if (/^mailto:/i.test(normalizedValue) || normalizedTitle.includes("email") || normalizedTitle.includes("mail")) {
    return "email";
  }

  if (
    /google\.com\/maps/i.test(normalizedValue) ||
    /maps\.apple\.com/i.test(normalizedValue) ||
    normalizedTitle.includes("direction") ||
    normalizedTitle.includes("map")
  ) {
    return "directions";
  }

  if (
    normalizedTitle.includes("book") ||
    normalizedTitle.includes("schedule") ||
    normalizedTitle.includes("appointment") ||
    /calendly|acuity|bookings?/i.test(normalizedValue)
  ) {
    return "booking";
  }

  if (normalizedTitle.includes("pay") || normalizedTitle.includes("payment") || normalizedTitle.includes("invoice")) {
    return "payment";
  }

  if (normalizedTitle.includes("pdf") || /\.pdf(?:$|[?#])/i.test(normalizedValue)) {
    return "pdf";
  }

  if (
    normalizedTitle.includes("website") ||
    normalizedTitle.includes("link") ||
    /^https?:\/\//i.test(normalizedValue) ||
    normalizedValue.startsWith("/")
  ) {
    return "website";
  }

  return "custom";
}

export function normalizeProfileButtonHref(type?: string | null, value?: string | null) {
  const normalizedType = normalizeProfileButtonType(type);

  switch (normalizedType) {
    case "phone":
      return phoneHref(value);
    case "text":
      return textHref(value);
    case "email":
      return emailHref(value);
    case "directions":
      return directionsHref(value);
    case "website":
    case "booking":
    case "pdf":
    case "payment":
    case "custom":
      return externalHref(value);
  }
}

export function getProfileButtonEditorValue(type?: string | null, value?: string | null) {
  const normalizedType = normalizeProfileButtonType(type);
  const trimmed = (value || "").trim();

  switch (normalizedType) {
    case "phone":
    case "text":
      return digitsOnly(trimmed);
    case "email":
      return trimmed.replace(/^mailto:/i, "");
    case "directions":
      if (/^https?:\/\/www\.google\.com\/maps/i.test(trimmed)) {
        try {
          const parsed = new URL(trimmed);
          return decodeURIComponent(parsed.searchParams.get("query") || trimmed);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    default:
      return trimmed;
  }
}

export function getProfileButtonSubtitle(type?: string | null, value?: string | null, phone?: string | null, email?: string | null) {
  const normalizedType = normalizeProfileButtonType(type);
  const digits = digitsOnly(value);

  switch (normalizedType) {
    case "phone":
      return phone || digits ? `Call ${phone || digits}` : "Call directly";
    case "text":
      return phone || digits ? `Text ${phone || digits}` : "Send a text";
    case "email":
      return email || value ? `Email ${email || value?.replace(/^mailto:/i, "")}` : "Send an email";
    case "directions":
      return "Open directions in Google Maps";
    case "booking":
      return "Open a booking link";
    case "pdf":
      return "Open a PDF document";
    case "payment":
      return "Open a payment link";
    case "website":
      return "Visit website";
    case "custom":
      return "Open link";
  }
}

export function normalizeProfileButtonLabel(value?: string | null, type?: string | null) {
  const label = (value || "").trim();
  return label || getProfileButtonTypeLabel(type);
}

export function buildProfileButtons(source: ProfileButtonRecordLike, options?: { limit?: number; hideEmail?: boolean }) {
  const limit = options?.limit ?? 4;
  const hideEmail = options?.hideEmail ?? false;
  const rawButtons = [
    {
      title: source.primary_link_1_title,
      value: source.primary_link_1_url,
      type: source.primary_link_1_type
    },
    {
      title: source.primary_link_2_title,
      value: source.primary_link_2_url,
      type: source.primary_link_2_type
    },
    {
      title: source.primary_link_3_title,
      value: source.primary_link_3_url,
      type: source.primary_link_3_type
    },
    {
      title: source.primary_link_4_title,
      value: source.primary_link_4_url,
      type: source.primary_link_4_type
    }
  ];

  return rawButtons
    .map((button) => {
      const title = normalizeProfileButtonLabel(button.title, button.type);
      const type = normalizeProfileButtonType(button.type || inferProfileButtonType(button.value, button.title));
      const value = (button.value || "").trim();
      const href = normalizeProfileButtonHref(type, value);

      if (!title || !href) return null;
      if (hideEmail && type === "email") return null;

      return {
        title,
        type,
        value,
        href,
        subtitle: getProfileButtonSubtitle(type, value, source.phone, source.email)
      } satisfies ProfileButton;
    })
    .filter((button): button is ProfileButton => !!button)
    .slice(0, limit);
}
