import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { InactiveState } from "@/components/dashboard/inactive-state";
import { DigitalPassCard } from "@/components/dashboard/digital-pass-card";
import {
  getDefaultProfileViewServer,
  getProfileForUserServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { createClient } from "@/lib/supabase/server";
import { getPreferredProfileShareUrl } from "@/lib/urls/profile-url";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

function profileHasFullAccess(profile: ProfileRecord) {
  return (
    !!profile.is_active ||
    !!profile.billing_exempt ||
    !!profile.lifetime_free ||
    profile.promo_code_used === "FOUNDERS" ||
    !!profile.is_admin
  );
}

function viewParamFor(view: ProfileViewRecord | null) {
  return view?.view_key || view?.id || null;
}

async function getInitialAuth(userId: string, email: string | undefined) {
  const profile = (await getProfileForUserServer(userId)) as ProfileRecord | null;

  return {
    email: email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}

export default async function DashboardPassPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/pass");
  }

  const profile = (await getProfileForUserServer(user.id)) as ProfileRecord | null;
  const initialAuth = await getInitialAuth(user.id, user.email);

  if (!profile) {
    redirect("/dashboard");
  }

  const fullAccess = profileHasFullAccess(profile);
  const profileViews = profile.id ? await getProfileViewsForProfileServer(profile.id) : [];
  const defaultProfileView = await getDefaultProfileViewServer(profile);
  const showViewPicker = profile.page_mode === "multi" && profileViews.length > 1;
  const passViews = showViewPicker
    ? profileViews.map((view) => ({
        id: view.id || view.view_key,
        label: view.name || view.view_key,
        url: getPreferredProfileShareUrl(profile, viewParamFor(view))
      }))
    : [
        {
          id: "profile",
          label: "Main profile",
          url: getPreferredProfileShareUrl(profile)
        }
      ];
  const defaultViewId =
    showViewPicker && defaultProfileView
      ? defaultProfileView.id || defaultProfileView.view_key
      : passViews[0]?.id || "profile";
  const myProfileHref = profile.slug ? `/${profile.slug}` : null;

  return (
    <Shell
      footerLeft="Digital pass"
      footerRight="Signal Pass"
      myProfileHref={myProfileHref}
      initialAuth={initialAuth}
    >
      <section className="simple-hero pass-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Digital pass</span>
        </div>
        <h1>Your QR, ready when your card is not.</h1>
        <p>Save this page to your phone home screen for quick in-person sharing.</p>
      </section>

      {fullAccess ? (
        <DigitalPassCard
          name={profile.full_name || user.email || "Signal Pass"}
          roleLine={profile.role_line || ""}
          organizationName={profile.organization_name}
          defaultViewId={defaultViewId}
          views={passViews}
        />
      ) : (
        <InactiveState email={user.email || ""} />
      )}
    </Shell>
  );
}
