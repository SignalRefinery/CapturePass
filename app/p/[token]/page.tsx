import { Shell } from "@/components/shared/shell";
import { TapTaggProfileShell } from "@/components/profile/taptagg-profile-shell";
import { createAdminClient } from "@/lib/supabase/admin";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

export default async function PassTokenPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pass_tokens")
    .select(`
      token,
      status,
      token_type,
      organization:organizations (
        name,
        brand_color,
        brand_color_primary,
        brand_color_secondary,
        brand_color_accent,
        brand_logo_url
      ),
      member:organization_members (
        name,
        email,
        phone,
        title,
        status
      )
    `)
    .eq("token", token)
    .maybeSingle();

  const member = Array.isArray(data?.member) ? data?.member[0] : data?.member;
  const organization = Array.isArray(data?.organization) ? data?.organization[0] : data?.organization;
  const canRender =
    !error &&
    data?.status === "active" &&
    member?.status === "active" &&
    !!member?.name;

  if (!canRender) {
    return (
      <Shell footerLeft="TapTagg Pass" footerRight="TapTagg">
        <section className="simple-hero">
          <div className="dashboard-card" style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="dashboard-kicker">Inactive pass</div>
            <h1>This TapTagg pass is not active.</h1>
            <p>
              This card or digital pass is not currently assigned to an active profile.
            </p>
          </div>
        </section>
      </Shell>
    );
  }

  const publicUrl = `${appUrl()}/p/${token}`;
  const profile = {
    slug: null,
    public_url: publicUrl,
    full_name: member.name,
    organization_name: organization?.name || "",
    brand_logo_url: organization?.brand_logo_url || null,
    brand_color_primary: organization?.brand_color_primary || organization?.brand_color || null,
    brand_color_secondary: organization?.brand_color_secondary || null,
    brand_color_accent: organization?.brand_color_accent || null,
    role_line: member.title || "",
    intro: `Connect with ${member.name}${organization?.name ? ` at ${organization.name}` : ""}.`,
    email: member.email || "",
    phone: member.phone || "",
    website_url: "",
    show_email: !!member.email,
    show_phone: !!member.phone,
    show_text: !!member.phone,
    primary_link_1_title: member.phone ? "Call" : "",
    primary_link_1_url: member.phone ? `tel:${member.phone.replace(/\D/g, "")}` : "",
    primary_link_2_title: member.email ? "Email" : "",
    primary_link_2_url: member.email ? `mailto:${member.email}` : "",
    primary_link_3_title: "",
    primary_link_3_url: "",
    primary_link_4_title: "",
    primary_link_4_url: ""
  };

  return (
    <TapTaggProfileShell
      profile={profile}
      views={[profile]}
      navViews={[profile]}
      pageMode="single"
      multiViewDisplayMode="favorite"
      heroLabel="Business pass"
    />
  );
}
