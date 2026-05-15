const FALLBACK_REDIRECT = "/dashboard";
const INTERNAL_REDIRECT_BASE = "https://signalpass.local";
const BLOCKED_REDIRECT_PATHS = new Set(["/login", "/signup", "/auth/callback"]);

export function safeInternalRedirect(value?: string | null, fallback = FALLBACK_REDIRECT) {
  const candidate = (value || "").trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, INTERNAL_REDIRECT_BASE);

    // Only relative, same-origin app paths are valid redirect destinations.
    if (url.origin !== INTERNAL_REDIRECT_BASE || BLOCKED_REDIRECT_PATHS.has(url.pathname)) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
