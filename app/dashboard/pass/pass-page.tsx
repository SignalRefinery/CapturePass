import { redirect } from "next/navigation";
import { getProfileForUserServer } from "@/lib/profile-service-server";
import { createClient } from "@/lib/supabase/server";
import { applyFounderAccess } from "@/lib/plans";
import type { ProfileRecord } from "@/lib/types";

function publicPassPathFor(profile: ProfileRecord) {
  if (profile.private_token) {
    return `/pass/${profile.private_token}`;
  }

  if (profile.slug) {
    return `/${profile.slug}`;
  }

  return "/dashboard";
}

export async function DashboardPassPageContent({
  requestedView: _requestedView,
  passError: _passError
}: {
  requestedView?: string | null;
  passError?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard/pass")}`);
  }

  const profile = applyFounderAccess(
    (await getProfileForUserServer(user.id)) as ProfileRecord | null,
    user.user_metadata?.promo_code
  );

  if (!profile) {
    redirect("/dashboard");
  }

  redirect(publicPassPathFor(profile));
  return null;
}

export function profileViewExists(_profileViews: unknown[], requestedView: string) {
  return requestedView === "main";
}
