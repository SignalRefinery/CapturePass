import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isTapTaggBootstrapAdminEmail,
  TAPTAGG_BOOTSTRAP_ADMIN_EMAIL
} from "@/lib/auth/admin-shared";

export { isTapTaggBootstrapAdminEmail, TAPTAGG_BOOTSTRAP_ADMIN_EMAIL };

export type TapTaggAdminUser = {
  id: string;
  email: string | null;
  isBootstrapAdmin: boolean;
  isDatabaseAdmin: boolean;
};

export async function getCurrentTapTaggAdmin(): Promise<TapTaggAdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const email = user.email.trim().toLowerCase();
  if (email === TAPTAGG_BOOTSTRAP_ADMIN_EMAIL) {
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

export async function requireTapTaggAdmin() {
  return getCurrentTapTaggAdmin();
}
