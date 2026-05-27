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
import { getProfilePlan } from "@/lib/plans";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

function viewParamFor(view: ProfileViewRecord | null) {
  return view?.view_key || view?.id || null;
}

function passPathFor(view: ProfileViewRecord | null) {
  return view ? `/dashboard/pass/${view.view_key || view.id}` : "/dashboard/pass/main";
}

function publicPassPathFor(profile: ProfileRecord, view: ProfileViewRecord | null) {
  if (!profile.private_token) {
    return passPathFor(view);
  }

  const viewParam = view ? viewParamFor(view) : "main";
  return viewParam
    ? `/pass/${profile.private_token}?view=${encodeURIComponent(viewParam)}`
    : `/pass/${profile.private_token}`;
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

  const plan = getProfilePlan(profile);
  const fullAccess = plan.isActivated;
  const profileViews = profile.id ? await getProfileViewsForProfileServer(profile.id) : [];
  const defaultProfileView = await getDefaultProfileViewServer(profile);
  const viewPasses = profileViews.map((view) => ({
    id: view.id || view.view_key,
    label: view.name || view.view_key,
    url: getPreferredProfileShareUrl(profile, viewParamFor(view)),
    passUrl: publicPassPathFor(profile, view)
  }));
  const passViews =
    plan.hasMoreProfileSections && profile.page_mode === "multi" && profileViews.length
      ? [
          {
            id: "main",
            label: "Main profile",
            url: getPreferredProfileShareUrl(profile),
            passUrl: publicPassPathFor(profile, null)
          },
          ...viewPasses
        ]
      : [
          {
            id: "main",
            label: "Main profile",
            url: getPreferredProfileShareUrl(profile),
            passUrl: publicPassPathFor(profile, null)
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
    plan.hasMoreProfileSections && profile.page_mode === "multi" && defaultProfileView
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
      footerRight="TapTagg"
      myProfileHref={myProfileHref}
      initialAuth={initialAuth}
    >
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
          name={profile.full_name || user.email || "TapTagg"}
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
