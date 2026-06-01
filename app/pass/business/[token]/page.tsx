import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DigitalPassCard } from "@/components/dashboard/digital-pass-card";
import { profileMetadata } from "@/lib/privacy/profile-privacy";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ view?: string }>;
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

export async function generateMetadata() {
  return profileMetadata();
}

export default async function BusinessDigitalPassPage({ params, searchParams }: PageProps) {
  noStore();

  const { token } = await params;
  const requestedView = (await searchParams)?.view || null;
  if (requestedView) {
    redirect(`/pass/business/${token}`);
  }

  const admin = createAdminClient();
  const { data: passToken } = await admin
    .from("pass_tokens")
    .select("id, token, status, organization_id, assigned_member_id")
    .eq("token", token)
    .maybeSingle();

  if (!passToken || passToken.status !== "active" || !passToken.assigned_member_id) {
    notFound();
  }

  const [{ data: member }, { data: organization }] = await Promise.all([
    admin
      .from("organization_members")
      .select("id, name, title, status")
      .eq("id", passToken.assigned_member_id)
      .maybeSingle(),
    passToken.organization_id
      ? admin
          .from("organizations")
          .select("name")
          .eq("id", passToken.organization_id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  if (!member || member.status !== "active" || !member.name) {
    notFound();
  }

  const publicProfileUrl = `${appUrl()}/p/${token}`;
  const passViews = [
    {
      id: "business",
      label: "Business profile",
      url: publicProfileUrl,
      passUrl: `/pass/business/${token}`
    }
  ];

  return (
    <main className="public-pass-page">
      <DigitalPassCard
        name={member.name}
        roleLine={member.title || ""}
        organizationName={organization?.name || null}
        defaultViewId="business"
        selectedViewId="business"
        views={passViews}
        showViewSwitcher={false}
      />
    </main>
  );
}
