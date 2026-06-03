import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { TapTaggProfileShell } from "@/components/profile/taptagg-profile-shell";
import {
  getDefaultProfileViewServer,
  getProfileForUserServer,
  getProfileViewsForProfileServer
} from "@/lib/profile-service-server";
import { buildPublicProfileViews, profileRecordToPublicProfile } from "@/lib/profiles/public-view";
import { createClient } from "@/lib/supabase/server";
import { applyFounderAccess, getProfilePlan } from "@/lib/plans";
import type { ProfileRecord } from "@/lib/types";

export default async function DashboardPreviewPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard/preview")}`);
  }

  const profile = applyFounderAccess(
    (await getProfileForUserServer(user.id)) as ProfileRecord | null,
    user.user_metadata?.promo_code
  );

  if (!profile) {
    redirect("/dashboard");
  }

  const plan = getProfilePlan(profile);
  const isMultiViewProfile = plan.hasMoreProfileSections && profile.page_mode === "multi";
  const profileViews = isMultiViewProfile && profile.id ? await getProfileViewsForProfileServer(profile.id) : [];
  const defaultProfileView = isMultiViewProfile ? await getDefaultProfileViewServer(profile) : null;
  const { defaultPublicView, orderedPublicViews } = isMultiViewProfile
    ? buildPublicProfileViews(profile, profileViews, defaultProfileView)
    : {
        defaultPublicView: profileRecordToPublicProfile(profile),
        orderedPublicViews: [profileRecordToPublicProfile(profile)]
      };
  const publicNavViews = orderedPublicViews.filter((view) => view.show_in_public_nav !== false);

  return (
    <Shell
      footerLeft="Profile preview"
      footerRight="TapTagg"
      initialAuth={{
        email: user.email || null,
        fullName: profile.full_name || null,
        slug: profile.slug || null
      }}
      navLinks={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pricing", label: "Pricing" }
      ]}
    >
      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Preview</div>
          <h2>{plan.isActivated ? "This is your live profile preview." : "This profile is not publicly active yet."}</h2>
          <p className="editor-copy">
            {plan.isActivated
              ? "Public visitors see this profile when they open your TapTagg link."
              : "Free / Reserved profiles can be previewed here, but public profile and QR sharing unlock with Digital. NFC unlocks with Core."}
          </p>
        </div>
      </section>

      <TapTaggProfileShell
        profile={defaultPublicView}
        views={orderedPublicViews}
        navViews={publicNavViews}
        pageMode={isMultiViewProfile ? profile.page_mode || "single" : "single"}
        multiViewDisplayMode={profile.multi_view_display_mode || "favorite"}
        heroLabel={plan.isActivated ? "Live preview" : "Reserved preview"}
      />
    </Shell>
  );
}
