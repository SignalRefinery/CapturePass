import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { CapturePassProfileShell } from "@/components/profile/taptagg-profile-shell";
import { resolvePublicBusinessProfile } from "@/lib/business/public-profile-route";

function buildPublicProfileMetadata({
  description,
  path,
  title
}: {
  description: string;
  path: string;
  title: string;
}) {
  return profileMetadata({
    description,
    path,
    title,
    visibility: "public"
  });
}

type PageProps = {
  params: Promise<{ slug: string; memberSlug: string }>;
  searchParams?: Promise<{ view?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug, memberSlug } = await params;
  const resolution = await resolvePublicBusinessProfile({ businessSlug: slug, memberSlug });

  if (resolution.kind === "render") {
    const { profile } = resolution;
    return buildPublicProfileMetadata({
      description:
        profile.intro ||
        `${profile.full_name}${profile.organization_name ? ` at ${profile.organization_name}` : ""}`,
      path: `/${profile.slug}`,
      title: profile.full_name || profile.organization_name || "CapturePass Profile"
    });
  }

  return profileMetadata();
}

export default async function PublicBusinessMemberProfilePage({ params, searchParams }: PageProps) {
  noStore();

  const { slug, memberSlug } = await params;
  const requestedView = (await searchParams)?.view || null;
  const resolution = await resolvePublicBusinessProfile({ businessSlug: slug, memberSlug });

  if (resolution.kind === "redirect") {
    redirect(resolution.redirectTo);
  }

  if (resolution.kind !== "render") {
    notFound();
  }

  const { profile } = resolution;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialAuth = user
    ? {
        email: user.email,
        fullName:
          user.user_metadata?.full_name ||
          `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim(),
        slug: null,
      }
    : null;

  return (
    <CapturePassProfileShell
      profile={profile}
      views={[profile]}
      navViews={[profile]}
      pageMode="single"
      multiViewDisplayMode="favorite"
      initialView={requestedView}
      heroLabel="Business profile"
      initialAuth={initialAuth}
    />
  );
}
