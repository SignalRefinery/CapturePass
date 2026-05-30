import { Shell } from "@/components/shared/shell";
import { TapTaggProfileShell } from "@/components/profile/taptagg-profile-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

type BusinessPassOrganization = {
  name?: string | null;
  brand_color?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
  brand_theme?: "deep_brand" | "clean_light" | "full_color" | "custom" | null;
  brand_logo_url?: string | null;
  business_link_1_title?: string | null;
  business_link_1_url?: string | null;
  business_link_2_title?: string | null;
  business_link_2_url?: string | null;
  business_link_3_title?: string | null;
  business_link_3_url?: string | null;
  business_link_4_title?: string | null;
  business_link_4_url?: string | null;
};

async function getPassOrganization(
  admin: ReturnType<typeof createAdminClient>,
  organizationId?: string | null
) {
  if (!organizationId) return { organization: null, error: null };

  const { data, error } = await admin
    .from("organizations")
    .select(`
      name,
      brand_color,
      brand_color_primary,
      brand_color_secondary,
      brand_color_accent,
      brand_theme,
      brand_logo_url,
      business_link_1_title,
      business_link_1_url,
      business_link_2_title,
      business_link_2_url,
      business_link_3_title,
      business_link_3_url,
      business_link_4_title,
      business_link_4_url
    `)
    .eq("id", organizationId)
    .maybeSingle();

  if (!error) {
    return { organization: data as BusinessPassOrganization | null, error: null };
  }

  console.warn("Business pass extended organization lookup failed; retrying minimal lookup", {
    organizationId,
    error: error.message
  });

  const fallback = await admin
    .from("organizations")
    .select("name, brand_color, brand_logo_url")
    .eq("id", organizationId)
    .maybeSingle();

  return {
    organization: (fallback.data as BusinessPassOrganization | null) || null,
    error: fallback.error
  };
}

async function getBusinessHomeUrl(
  admin: ReturnType<typeof createAdminClient>,
  organizationId?: string | null
) {
  if (!organizationId) return null;

  const { data: admins, error: adminsError } = await admin
    .from("organization_members")
    .select("id, email")
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (adminsError || !admins?.length) return null;

  const businessAdmin = admins.find(
    (member) => (member.email || "").toLowerCase() !== "john@signalrefinery.pro"
  ) || admins[0];

  if (!businessAdmin?.id) return null;

  const { data: adminToken } = await admin
    .from("pass_tokens")
    .select("token")
    .eq("organization_id", organizationId)
    .eq("assigned_member_id", businessAdmin.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return adminToken?.token ? `${appUrl()}/p/${adminToken.token}` : null;
}

export default async function PassTokenPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  noStore();

  const { token } = await params;
  const admin = createAdminClient();
  const { data: passToken, error: tokenError } = await admin
    .from("pass_tokens")
    .select("token, status, token_type, organization_id, assigned_member_id")
    .eq("token", token)
    .maybeSingle();

  const [{ data: member, error: memberError }, organizationResult] =
    passToken
      ? await Promise.all([
          passToken.assigned_member_id
            ? admin
                .from("organization_members")
                .select("name, email, phone, title, status")
                .eq("id", passToken.assigned_member_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          getPassOrganization(admin, passToken.organization_id)
        ])
      : [
          { data: null, error: null },
          { organization: null, error: null }
        ];
  const organization = organizationResult.organization;
  const organizationError = organizationResult.error;
  const canRender =
    !tokenError &&
    !memberError &&
    passToken?.status === "active" &&
    member?.status === "active" &&
    !!member?.name;

  if (!canRender) {
    console.info("Business pass token inactive or unresolved", {
      token,
      tokenStatus: passToken?.status || null,
      assignedMemberId: passToken?.assigned_member_id || null,
      memberStatus: member?.status || null,
      tokenError: tokenError?.message || null,
      memberError: memberError?.message || null,
      organizationError: organizationError?.message || null
    });
  }

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
  const businessHomeUrl = await getBusinessHomeUrl(admin, passToken.organization_id);
  const businessLinks = [
    { title: organization?.business_link_1_title, url: organization?.business_link_1_url },
    { title: organization?.business_link_2_title, url: organization?.business_link_2_url },
    { title: organization?.business_link_3_title, url: organization?.business_link_3_url },
    { title: organization?.business_link_4_title, url: organization?.business_link_4_url }
  ]
    .map((item) => ({
      title: (item.title || "").trim(),
      url: (item.url || "").trim()
    }))
    .filter((item) => item.title && item.url);
  const profile = {
    slug: null,
    public_url: publicUrl,
    business_home_url: businessHomeUrl || publicUrl,
    is_business_profile: true,
    business_links: businessLinks,
    full_name: member.name,
    organization_name: organization?.name || "",
    brand_logo_url: organization?.brand_logo_url || null,
    brand_color_primary: organization?.brand_color_primary || organization?.brand_color || null,
    brand_color_secondary: organization?.brand_color_secondary || null,
    brand_color_accent: organization?.brand_color_accent || null,
    brand_theme: organization?.brand_theme || "full_color",
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
