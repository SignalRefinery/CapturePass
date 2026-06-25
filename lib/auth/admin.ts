import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL,
  TAPTAGG_BOOTSTRAP_ADMIN_EMAIL,
  isCapturePassBootstrapAdminEmail,
  isTapTaggBootstrapAdminEmail
} from "@/lib/auth/admin-shared";

export {
  CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL,
  TAPTAGG_BOOTSTRAP_ADMIN_EMAIL,
  isCapturePassBootstrapAdminEmail,
  isTapTaggBootstrapAdminEmail
};

export type CapturePassAdminUser = {
  id: string;
  email: string | null;
  isBootstrapAdmin: boolean;
  isDatabaseAdmin: boolean;
};

export type TapTaggAdminUser = CapturePassAdminUser;

export async function getCurrentCapturePassAdmin(): Promise<CapturePassAdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const email = user.email.trim().toLowerCase();
  if (email === CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL) {
    return {
      id: user.id,
      email: user.email,
      isBootstrapAdmin: true,
      isDatabaseAdmin: false
    };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isBootstrapAdmin: false,
    isDatabaseAdmin: true
  };
}

export const getCurrentTapTaggAdmin = getCurrentCapturePassAdmin;

export async function requireCapturePassAdmin() {
  return getCurrentCapturePassAdmin();
}

export const requireTapTaggAdmin = requireCapturePassAdmin;
