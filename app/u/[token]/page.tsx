import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPublicProfileViews } from "@/lib/profiles/public-view";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { LuxuryProfileShell } from "@/components/profile/luxury-profile-shell";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata() {
  return profileMetadata();
}

export default async function PrivateTokenProfilePage({ params }: PageProps) {
  noStore();

  const { token } = await params;
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

  if (profile.consent_public_visibility === true) {
    redirect(`/${profile.slug}`);
  }

  const { data: profileViews } = await admin
    .from("profile_views")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .returns<ProfileViewRecord[]>();
  const defaultProfileView =
    (profile.default_view_id
      ? (profileViews || []).find((view) => view.id === profile.default_view_id)
      : null) ||
    (profileViews || [])[0] ||
    null;
  const { defaultPublicView, orderedPublicViews } = buildPublicProfileViews(
    profile,
    profileViews || [],
    defaultProfileView
  );

  // Privacy-mode profiles render only through this unguessable issued URL.
  // The personalized slug remains non-resolving while the QR/private link works.
  return (
    <LuxuryProfileShell
      profile={defaultPublicView}
      views={orderedPublicViews}
      pageMode={profile.page_mode || "single"}
      multiViewDisplayMode={profile.multi_view_display_mode || "favorite"}
      heroLabel="Live profile"
    />
  );
}
