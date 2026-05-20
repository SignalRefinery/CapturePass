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

function passPathFor(view: ProfileViewRecord | null) {
  return view ? `/dashboard/pass/${view.view_key || view.id}` : "/dashboard/pass/main";
}

function matchesRequestedView(view: ProfileViewRecord, requestedView: string) {
  return view.view_key === requestedView || view.id === requestedView;
}

async function getInitialAuth(userId: string, email: string | undefined) {
  const profile = (await getProfileForUserServer(userId)) as ProfileRecord | null;

  return {
    email: email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}

export async function DashboardPassPageContent({
  requestedView,
  passError
}: {
  requestedView?: string | null;
  passError?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(requestedView ? `/dashboard/pass/${requestedView}` : "/dashboard/pass")}`);
  }

  const profile = (await getProfileForUserServer(user.id)) as ProfileRecord | null;
  const initialAuth = await getInitialAuth(user.id, user.email);

  if (!profile) {
    redirect("/dashboard");
  }

  const fullAccess = profileHasFullAccess(profile);
  const profileViews = profile.id ? await getProfileViewsForProfileServer(profile.id) : [];
  const defaultProfileView = await getDefaultProfileViewServer(profile);
  const viewPasses = profileViews.map((view) => ({
    id: view.id || view.view_key,
    label: view.name || view.view_key,
    url: getPreferredProfileShareUrl(profile, viewParamFor(view)),
    passUrl: passPathFor(view)
  }));
  const passViews =
    profile.page_mode === "multi" && profileViews.length
      ? [
          {
            id: "main",
            label: "Main profile",
            url: getPreferredProfileShareUrl(profile),
            passUrl: "/dashboard/pass/main"
          },
          ...viewPasses
        ]
      : [
          {
            id: "main",
            label: "Main profile",
            url: getPreferredProfileShareUrl(profile),
            passUrl: "/dashboard/pass/main"
          }
        ];
  if (
    requestedView &&
    requestedView !== "main" &&
    !profileViews.some((view) => matchesRequestedView(view, requestedView))
  ) {
    redirect(getPreferredProfileShareUrl(profile));
  }

  const defaultViewId =
    profile.page_mode === "multi" && defaultProfileView
      ? defaultProfileView.id || defaultProfileView.view_key
      : "main";
  const selectedViewId =
    requestedView && requestedView !== "main"
      ? passViews.find((view) => view.id === requestedView || view.passUrl.endsWith(`/${requestedView}`))?.id
      : requestedView === "main"
        ? "main"
        : defaultViewId;
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

      {passError === "missing-view" ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card pass-alert">
            <div className="dashboard-kicker">Pass view unavailable</div>
            <p className="editor-copy">That view was not found, so we brought you back to your default digital pass.</p>
          </div>
        </section>
      ) : null}

      {fullAccess ? (
        <DigitalPassCard
          name={profile.full_name || user.email || "Signal Pass"}
          roleLine={profile.role_line || ""}
          organizationName={profile.organization_name}
          defaultViewId={defaultViewId}
          selectedViewId={selectedViewId}
          views={passViews}
        />
      ) : (
        <InactiveState email={user.email || ""} />
      )}
    </Shell>
  );
}

export function profileViewExists(profileViews: ProfileViewRecord[], requestedView: string) {
  return requestedView === "main" || profileViews.some((view) => matchesRequestedView(view, requestedView));
}
