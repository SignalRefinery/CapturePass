export const TAPTAGG_BOOTSTRAP_ADMIN_EMAIL = "john@signalrefinery.pro";

export function isTapTaggBootstrapAdminEmail(email?: string | null) {
  return !!email && email.trim().toLowerCase() === TAPTAGG_BOOTSTRAP_ADMIN_EMAIL;
}
