import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DigitalPassCard } from "@/components/dashboard/digital-pass-card";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { getPreferredProfileShareUrl } from "@/lib/urls/profile-url";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ view?: string }>;
};

function viewParamFor(view: ProfileViewRecord | null) {
  return view?.view_key || view?.id || null;
}

function publicPassPathFor(token: string, view?: string | null) {
  return view && view !== "default"
    ? `/pass/${token}?view=${encodeURIComponent(view)}`
    : `/pass/${token}`;
}

function matchesRequestedView(view: ProfileViewRecord, requestedView: string) {
  return view.view_key === requestedView || view.id === requestedView;
}

export async function generateMetadata() {
  return profileMetadata();
}

export default async function PublicDigitalPassPage({ params, searchParams }: PageProps) {
  noStore();

  const { token } = await params;
  const requestedView = (await searchParams)?.view || null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("private_token", token)
    .maybeSingle<ProfileRecord>();

  if (
    !profile ||
    profile.is_active === false ||
    !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
  ) {
    notFound();
  }

  const { data: profileViews } = await admin
    .from("profile_views")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .returns<ProfileViewRecord[]>();
  const views = profileViews || [];
  const defaultProfileView =
    (profile.default_view_id
      ? views.find((view) => view.id === profile.default_view_id)
      : null) ||
    views[0] ||
    null;
  const requestedProfileView =
    requestedView && requestedView !== "main"
      ? views.find((view) => matchesRequestedView(view, requestedView))
      : null;

  if (
    requestedView &&
    requestedView !== "main" &&
    (profile.page_mode !== "multi" || !requestedProfileView)
  ) {
    redirect(`/pass/${token}`);
  }

  const viewPasses = views.map((view) => {
    const viewParam = viewParamFor(view);
    return {
      id: view.id || view.view_key,
      label: view.name || view.view_key,
      url: getPreferredProfileShareUrl(profile, viewParam),
      passUrl: publicPassPathFor(token, viewParam)
    };
  });
  const passViews =
    profile.page_mode === "multi" && views.length
      ? [
          {
            id: "main",
            label: "Main profile",
            url: getPreferredProfileShareUrl(profile),
            passUrl: publicPassPathFor(token, "main")
          },
          ...viewPasses
        ]
      : [
          {
            id: "main",
            label: "Main profile",
            url: getPreferredProfileShareUrl(profile),
            passUrl: publicPassPathFor(token, "main")
          }
        ];
  const defaultViewId =
    profile.page_mode === "multi" && defaultProfileView
      ? defaultProfileView.id || defaultProfileView.view_key
      : "main";
  const selectedViewId =
    requestedView && requestedView !== "main"
      ? requestedProfileView?.id || requestedProfileView?.view_key
      : requestedView === "main"
        ? "main"
        : defaultViewId;

  return (
    <main className="public-pass-page">
      <DigitalPassCard
        name={profile.full_name || "TapTagg"}
        roleLine={profile.role_line || ""}
        organizationName={profile.organization_name}
        defaultViewId={defaultViewId}
        selectedViewId={selectedViewId}
        views={passViews}
        showViewSwitcher={false}
      />
    </main>
  );
}
