import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { InactiveState } from "@/components/dashboard/inactive-state";
import { DigitalPassCard } from "@/components/dashboard/digital-pass-card";
import { getProfileForUserServer } from "@/lib/profile-service-server";
import { createClient } from "@/lib/supabase/server";
import { getPreferredProfileShareUrl } from "@/lib/urls/profile-url";
import { applyFounderAccess, getProfilePlan } from "@/lib/plans";
import type { ProfileRecord } from "@/lib/types";

function publicPassPathFor(profile: ProfileRecord) {
  return profile.private_token ? `/pass/${profile.private_token}` : "/dashboard/pass";
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
    redirect(`/login?next=${encodeURIComponent("/dashboard/pass")}`);
  }

  if (requestedView && requestedView !== "main") {
    redirect("/dashboard/pass");
  }

  const profile = applyFounderAccess(
    (await getProfileForUserServer(user.id)) as ProfileRecord | null,
    user.user_metadata?.promo_code
  );
  const initialAuth = await getInitialAuth(user.id, user.email);

  if (!profile) {
    redirect("/dashboard");
  }

  const plan = getProfilePlan(profile);
  const fullAccess = plan.isActivated;
  const passViews = [
    {
      id: "main",
      label: "Profile",
      url: getPreferredProfileShareUrl(profile),
      passUrl: publicPassPathFor(profile)
    }
  ];
  const myProfileHref = profile.slug ? `/${profile.slug}` : null;

  return (
    <Shell
      footerLeft="Digital pass"
      footerRight="CapturePass"
      myProfileHref={myProfileHref}
      initialAuth={initialAuth}
      pageVariant="light"
    >
      {passError === "missing-view" ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card pass-alert">
            <div className="dashboard-kicker">Pass unavailable</div>
            <p className="editor-copy">That pass was not found, so we brought you back to your CapturePass digital pass.</p>
          </div>
        </section>
      ) : null}

      {fullAccess ? (
        <DigitalPassCard
          name={profile.full_name || user.email || "CapturePass"}
          roleLine={profile.role_line || ""}
          organizationName={profile.organization_name}
          defaultViewId="main"
          selectedViewId="main"
          views={passViews}
        />
      ) : (
        <InactiveState email={user.email || ""} />
      )}
    </Shell>
  );
}

export function profileViewExists(_profileViews: unknown[], requestedView: string) {
  return requestedView === "main";
}
