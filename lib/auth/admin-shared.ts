export const CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL = "john@handshakeiq.org";
export const TAPTAGG_BOOTSTRAP_ADMIN_EMAIL = CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL;

export function isCapturePassBootstrapAdminEmail(email?: string | null) {
  return !!email && email.trim().toLowerCase() === CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL;
}

export const isTapTaggBootstrapAdminEmail = isCapturePassBootstrapAdminEmail;
