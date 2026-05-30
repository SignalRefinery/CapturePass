import { redirect } from "next/navigation";
import Link from "next/link";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { Shell } from "@/components/shared/shell";
import { claimBusinessOrganizationForUser } from "@/lib/business/organization-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { generatePrivateToken } from "@/lib/utils/generate-token";
import type {
  OrganizationMemberRecord,
  OrganizationRecord,
  PassTokenRecord
} from "@/lib/types";

type BusinessData = {
  organization: OrganizationRecord | null;
  members: OrganizationMemberRecord[];
  tokens: PassTokenRecord[];
};

type BusinessSummary = {
  organization: OrganizationRecord;
  memberCount: number;
  tokenCount: number;
  activeTokenCount: number;
};

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

function cleanHexColor(value: FormDataEntryValue | null) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
}

function cleanBrandTheme(value: FormDataEntryValue | null) {
  const theme = String(value || "").trim();
  return ["deep_brand", "clean_light", "full_color", "custom"].includes(theme)
    ? theme
    : "full_color";
}

function tokenUrl(token: string) {
  return `${appUrl()}/p/${token}`;
}

function businessLoginPath(slug?: string | null) {
  return slug ? `/${slug}/login` : "/dashboard/business";
}

function businessLoginUrl(slug?: string | null) {
  return `${appUrl()}${businessLoginPath(slug)}`;
}

function businessInviteRedirectUrl(slug?: string | null) {
  const callbackUrl = new URL("/auth/callback", appUrl());
  const passwordUrl = new URL("/update-password", appUrl());
  passwordUrl.searchParams.set("next", businessLoginPath(slug));
  callbackUrl.searchParams.set("next", `${passwordUrl.pathname}${passwordUrl.search}`);
  return callbackUrl.toString();
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

async function sendBusinessInviteEmail({
  organization,
  member
}: {
  organization: Pick<OrganizationRecord, "id" | "name" | "slug">;
  member: Pick<OrganizationMemberRecord, "id" | "name" | "email" | "role">;
}) {
  const email = (member.email || "").trim();
  if (!email || !organization.slug) return { sent: false, reason: "missing_email_or_slug" };

  const admin = createAdminClient();
  const redirectTo = businessInviteRedirectUrl(organization.slug);

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      business_only: true,
      organization_id: organization.id,
      organization_slug: organization.slug,
      organization_member_id: member.id,
      full_name: member.name,
      business_role: member.role
    }
  });

  if (!error) {
    console.info("Business invite email sent", {
      organizationId: organization.id,
      memberId: member.id,
      role: member.role,
      redirectTo
    });
    return { sent: true };
  }

  const message = error.message.toLowerCase();
  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists")
  ) {
    const { error: resetError } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (!resetError) {
      console.info("Business password setup email sent to existing auth user", {
        organizationId: organization.id,
        memberId: member.id,
        role: member.role,
        redirectTo
      });
      return { sent: true };
    }

    console.error("Business password setup email failed", {
      organizationId: organization.id,
      memberId: member.id,
      error: resetError.message
    });
    return { sent: false, reason: resetError.message };
  }

  console.error("Business invite email failed", {
    organizationId: organization.id,
    memberId: member.id,
    error: error.message
  });
  return { sent: false, reason: error.message };
}

async function getBusinessIndex(): Promise<BusinessSummary[]> {
  const admin = createAdminClient();
  const [{ data: organizations }, { data: members }, { data: tokens }] = await Promise.all([
    admin.from("organizations").select("*").order("created_at", { ascending: false }),
    admin.from("organization_members").select("organization_id, status"),
    admin.from("pass_tokens").select("organization_id, status")
  ]);

  return ((organizations || []) as OrganizationRecord[]).map((organization) => {
    const orgMembers = (members || []).filter((member) => member.organization_id === organization.id);
    const orgTokens = (tokens || []).filter((token) => token.organization_id === organization.id);

    return {
      organization,
      memberCount: orgMembers.length,
      tokenCount: orgTokens.length,
      activeTokenCount: orgTokens.filter((token) => token.status === "active").length
    };
  });
}

async function getBusinessData(
  userId: string,
  email?: string | null,
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<BusinessData> {
  const admin = createAdminClient();

  if (organizationId) {
    const { data: requestedOrg } = await admin
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();

    if (!requestedOrg) {
      return { organization: null, members: [], tokens: [] };
    }

    if (!isPlatformAdmin) {
      const { data: allowedMember } = await admin
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .eq("status", "active")
        .in("role", ["owner", "admin"])
        .maybeSingle();

      if (requestedOrg.owner_user_id !== userId && !allowedMember) {
        return { organization: null, members: [], tokens: [] };
      }
    }

    const [{ data: members }, { data: tokens }] = await Promise.all([
      admin
        .from("organization_members")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("created_at", { ascending: true }),
      admin
        .from("pass_tokens")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("created_at", { ascending: true })
    ]);

    return {
      organization: requestedOrg as OrganizationRecord,
      members: (members || []) as OrganizationMemberRecord[],
      tokens: (tokens || []) as PassTokenRecord[]
    };
  }

  const { data: ownedOrg } = await admin
    .from("organizations")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let organization = ownedOrg as OrganizationRecord | null;

  if (!organization) {
    const { data: adminMember } = await admin
      .from("organization_members")
      .select("organization:organizations(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("role", ["owner", "admin"])
      .limit(1)
      .maybeSingle();

    const org = Array.isArray(adminMember?.organization)
      ? adminMember?.organization[0]
      : adminMember?.organization;
    organization = (org as OrganizationRecord | undefined) || null;
  }

  if (!organization) {
    organization = await claimBusinessOrganizationForUser({ userId, email });
  }

  if (!organization) {
    return { organization: null, members: [], tokens: [] };
  }

  const [{ data: members }, { data: tokens }] = await Promise.all([
    admin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true }),
    admin
      .from("pass_tokens")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true })
  ]);

  return {
    organization,
    members: (members || []) as OrganizationMemberRecord[],
    tokens: (tokens || []) as PassTokenRecord[]
  };
}

async function requireBusinessAdmin(organizationId: string) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isPlatformAdmin = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organization?.owner_user_id === user.id || isPlatformAdmin) return user;

  const { data: member } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (!member) redirect("/dashboard/business");
  return user;
}

async function createOrganization(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const adminName = String(formData.get("admin_name") || "").trim();
  const adminEmail = String(formData.get("admin_email") || "").trim();
  const adminPhone = String(formData.get("admin_phone") || "").trim();
  const adminTitle = String(formData.get("admin_title") || "").trim();
  const managedService = formData.get("managed_service_enabled") === "on";

  if (!name) redirect("/dashboard/business?error=missing_org_name");
  if (!adminName) redirect("/dashboard/business?error=missing_admin_name");

  const admin = createAdminClient();
  const slug = await generateUniqueOrganizationSlug(name);
  const { data: organization, error } = await admin
    .from("organizations")
    .insert({
      name,
      slug,
      owner_user_id: user.id,
      managed_service_enabled: managedService
    })
    .select("id, name, slug")
    .single();

  if (error || !organization) redirect("/dashboard/business?error=org_create_failed");

  const { data: businessAdminMember } = await admin
    .from("organization_members")
    .insert({
      organization_id: organization.id,
      name: adminName,
      email: adminEmail || null,
      phone: adminPhone || null,
      title: adminTitle || null,
      role: "admin",
      status: "active"
    })
    .select("id, name, email, role")
    .single();

  if (businessAdminMember) {
    await sendBusinessInviteEmail({
      organization,
      member: businessAdminMember as Pick<OrganizationMemberRecord, "id" | "name" | "email" | "role">
    });
  }

  if (adminEmail.toLowerCase() !== ADMIN_EMAILS[0]) {
    await admin.from("organization_members").insert({
      organization_id: organization.id,
      name: "TapTagg Admin",
      email: ADMIN_EMAILS[0],
      title: "Platform admin",
      role: "admin",
      status: "active"
    });
  }

  redirect(`/dashboard/business?org=${organization.id}`);
}

async function updateOrganizationBranding(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const brandLogoUrl = String(formData.get("brand_logo_url") || "").trim();
  const admin = createAdminClient();

  await admin
    .from("organizations")
    .update({
      brand_theme: cleanBrandTheme(formData.get("brand_theme")),
      brand_color_primary: cleanHexColor(formData.get("brand_color_primary")),
      brand_color_secondary: cleanHexColor(formData.get("brand_color_secondary")),
      brand_color_accent: cleanHexColor(formData.get("brand_color_accent")),
      brand_color: cleanHexColor(formData.get("brand_color_primary")),
      brand_logo_url: brandLogoUrl || null
    })
    .eq("id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function generateUniqueOrganizationSlug(name: string) {
  const admin = createAdminClient();
  const base = slugify(name) || `business-${generatePrivateToken(6)}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const [{ data: existingOrg }, { data: existingProfile }] = await Promise.all([
      admin.from("organizations").select("id").eq("slug", candidate).maybeSingle(),
      admin.from("profiles").select("id").eq("slug", candidate).maybeSingle()
    ]);

    if (!existingOrg && !existingProfile) return candidate;
  }

  return `${base}-${generatePrivateToken(6)}`;
}

async function addEmployee(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const title = String(formData.get("title") || "").trim();

  if (!name) redirect("/dashboard/business?error=missing_employee_name");

  const admin = createAdminClient();
  const { count } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const [{ data: organization }, { data: member }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, slug")
      .eq("id", organizationId)
      .maybeSingle(),
    admin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        name,
        email: email || null,
        phone: phone || null,
        title: title || null,
        role: count === 0 ? "admin" : "member",
        status: "active"
      })
      .select("id, name, email, role")
      .single()
  ]);

  if (organization && member) {
    await sendBusinessInviteEmail({
      organization,
      member: member as Pick<OrganizationMemberRecord, "id" | "name" | "email" | "role">
    });
  }

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function sendBusinessLoginInvite(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const admin = createAdminClient();
  const [{ data: organization }, { data: member }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, slug")
      .eq("id", organizationId)
      .maybeSingle(),
    admin
      .from("organization_members")
      .select("id, name, email, role")
      .eq("id", memberId)
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (!organization || !member?.email) {
    redirect(`/dashboard/business?org=${organizationId}&error=missing_member_email`);
  }

  await sendBusinessInviteEmail({
    organization,
    member: member as Pick<OrganizationMemberRecord, "id" | "name" | "email" | "role">
  });

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function generateUniqueToken() {
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = generatePrivateToken(12);
    const { data } = await admin
      .from("pass_tokens")
      .select("id")
      .eq("token", token)
      .maybeSingle();

    if (!data) return token;
  }

  return generatePrivateToken(16);
}

async function issueToken(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const assignedMemberId = String(formData.get("assigned_member_id") || "") || null;
  const tokenType = String(formData.get("token_type") || "both");
  const token = await generateUniqueToken();
  const admin = createAdminClient();

  await admin.from("pass_tokens").insert({
    organization_id: organizationId,
    token,
    assigned_member_id: assignedMemberId,
    status: assignedMemberId ? "active" : "unassigned",
    token_type: tokenType
  });

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function updateTokenAssignment(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const tokenId = String(formData.get("token_id") || "");
  const assignedMemberId = String(formData.get("assigned_member_id") || "") || null;
  const admin = createAdminClient();

  await admin
    .from("pass_tokens")
    .update({
      assigned_member_id: assignedMemberId,
      status: assignedMemberId ? "active" : "unassigned"
    })
    .eq("id", tokenId)
    .eq("organization_id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function deactivateToken(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const tokenId = String(formData.get("token_id") || "");
  const admin = createAdminClient();

  await admin
    .from("pass_tokens")
    .update({ status: "inactive" })
    .eq("id", tokenId)
    .eq("organization_id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function deactivateEmployee(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const admin = createAdminClient();

  await admin
    .from("organization_members")
    .update({ status: "inactive" })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  await admin
    .from("pass_tokens")
    .update({ status: "inactive" })
    .eq("assigned_member_id", memberId)
    .eq("organization_id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

export default async function BusinessDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; org?: string; onboard?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const isPlatformAdmin = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const selectedOrganizationId = params?.org || null;
  const showOnboarding = params?.onboard === "1";
  const businessIndex = isPlatformAdmin ? await getBusinessIndex() : [];
  const { organization, members, tokens } = showOnboarding
    ? { organization: null, members: [], tokens: [] }
    : await getBusinessData(user.id, user.email, selectedOrganizationId, isPlatformAdmin);
  const initialAuth = {
    email: user.email || null,
    fullName: user.user_metadata?.full_name || null,
    slug: null
  };

  if (isPlatformAdmin && !selectedOrganizationId && !showOnboarding) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth}>
        <section className="simple-hero">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Business operations</span>
          </div>
          <h1>Business accounts</h1>
          <p>Review every business, open its console, or onboard a new business account.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
            <Link className="button primary" href="/dashboard/business?onboard=1">
              Onboard new business
            </Link>
            <Link className="button secondary" href="/admin">
              Admin users
            </Link>
          </div>
        </section>

        <section className="dashboard-wrap">
          <div className="dashboard-grid">
            {businessIndex.map(({ organization: org, memberCount, tokenCount, activeTokenCount }) => (
              <article className="dashboard-card" key={org.id}>
                <div className="dashboard-kicker">Business account</div>
                <h2>{org.name}</h2>
                <p className="editor-copy">
                  {memberCount} member{memberCount === 1 ? "" : "s"} · {activeTokenCount}/{tokenCount} active token{tokenCount === 1 ? "" : "s"}
                </p>
                <p className="editor-copy" style={{ wordBreak: "break-all" }}>
                  {org.slug ? businessLoginUrl(org.slug) : "No business slug yet"}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="button primary" href={`/dashboard/business?org=${org.id}`}>
                    Manage business
                  </Link>
                  {org.slug ? (
                    <>
                      <Link className="button secondary" href={businessLoginPath(org.slug)}>
                        Login page
                      </Link>
                      <CopyLinkButton value={businessLoginUrl(org.slug)} />
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          {businessIndex.length === 0 ? (
            <div className="dashboard-card">
              <div className="dashboard-kicker">No businesses yet</div>
              <h2>Onboard the first business.</h2>
              <Link className="button primary" href="/dashboard/business?onboard=1">
                Onboard new business
              </Link>
            </div>
          ) : null}
        </section>
      </Shell>
    );
  }

  if (!organization) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth}>
        <section className="simple-hero">
          <div className="dashboard-card" style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="dashboard-kicker">Business setup</div>
            <h1>Create your company account.</h1>
            <p>
              Business TapTagg uses permanent card/pass URLs that can be reassigned as your team changes.
              The business admin receives an email invite to set their own password.
            </p>
            <form action={createOrganization} className="editor-form" style={{ marginTop: 24 }}>
              <label className="editor-label">
                Company name
                <input className="editor-input" name="name" required />
              </label>
              <div className="editor-grid">
                <label className="editor-label">
                  Business admin name
                  <input className="editor-input" name="admin_name" required />
                </label>
                <label className="editor-label">
                  Business admin title
                  <input className="editor-input" name="admin_title" placeholder="Owner, manager, office admin..." />
                </label>
              </div>
              <div className="editor-grid">
                <label className="editor-label">
                  Business admin email for login invite
                  <input className="editor-input" name="admin_email" type="email" />
                </label>
                <label className="editor-label">
                  Business admin phone
                  <input className="editor-input" name="admin_phone" type="tel" />
                </label>
              </div>
              <label className="checkbox-row">
                <input name="managed_service_enabled" type="checkbox" />
                Managed setup and service +$199/month
              </label>
              <button className="button primary" type="submit">
                Create account and send invite
              </button>
              {isPlatformAdmin ? (
                <Link className="button secondary" href="/dashboard/business">
                  Back to business accounts
                </Link>
              ) : null}
            </form>
          </div>
        </section>
      </Shell>
    );
  }

  const activeMembers = members.filter((member) => member.status === "active");
  const memberById = new Map(members.map((member) => [member.id, member]));

  return (
    <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth}>
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Business dashboard</span>
        </div>
        <h1>{organization.name}</h1>
        <p>
          Manage employees, permanent card/pass tokens, and phone-first digital sharing for your team.
        </p>
        {isPlatformAdmin ? (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
            <Link className="button secondary" href="/dashboard/business">
              All businesses
            </Link>
            <Link className="button primary" href="/dashboard/business?onboard=1">
              Onboard new business
            </Link>
          </div>
        ) : null}
      </section>

      {params?.error ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card pass-alert">
            <div className="dashboard-kicker">Action needed</div>
            <p className="editor-copy">Please complete the required business fields and try again.</p>
          </div>
        </section>
      ) : null}

      <section className="dashboard-wrap">
        <div className="dashboard-grid">
          {organization.slug ? (
            <div className="dashboard-card">
              <div className="dashboard-kicker">Business login</div>
              <h2>Team login link.</h2>
              <p className="editor-copy" style={{ wordBreak: "break-all" }}>
                {businessLoginUrl(organization.slug)}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button secondary" href={businessLoginPath(organization.slug)}>
                  Open business login
                </Link>
                <CopyLinkButton value={businessLoginUrl(organization.slug)} />
              </div>
            </div>
          ) : null}

          <div className="dashboard-card">
            <div className="dashboard-kicker">Managed service</div>
            <h2>{organization.managed_service_enabled ? "Managed service enabled." : "Managed setup available."}</h2>
            <p className="editor-copy">
              Add managed setup, employee changes, card routing help, and ongoing support for +$199/month.
            </p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-kicker">Digital pass first</div>
            <h2>QR is the daily share method.</h2>
            <p className="editor-copy">
              NFC cards create the physical moment. Digital Pass QR links point at permanent /p/token URLs that survive turnover.
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Business branding</div>
          <h2>Customize pass pages.</h2>
          <p className="editor-copy">
            These colors and logo apply to business token pages like /p/token.
          </p>
          <form action={updateOrganizationBranding} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <label className="editor-label">
              Page theme
              <select className="editor-input" name="brand_theme" defaultValue={organization.brand_theme || "full_color"}>
                <option value="full_color">Full color brand</option>
                <option value="clean_light">Clean light brand</option>
                <option value="deep_brand">Deep brand</option>
                <option value="custom">Custom palette</option>
              </select>
            </label>
            <div className="editor-grid">
              <label className="editor-label">
                Primary color
                <input
                  className="editor-input"
                  name="brand_color_primary"
                  type="color"
                  defaultValue={organization.brand_color_primary || organization.brand_color || "#8b5cf6"}
                />
              </label>
              <label className="editor-label">
                Secondary color
                <input
                  className="editor-input"
                  name="brand_color_secondary"
                  type="color"
                  defaultValue={organization.brand_color_secondary || "#a78bfa"}
                />
              </label>
              <label className="editor-label">
                Accent color
                <input
                  className="editor-input"
                  name="brand_color_accent"
                  type="color"
                  defaultValue={organization.brand_color_accent || "#3b82f6"}
                />
              </label>
            </div>
            <label className="editor-label">
              Logo PNG URL
              <input
                className="editor-input"
                name="brand_logo_url"
                type="url"
                placeholder="https://..."
                defaultValue={organization.brand_logo_url || ""}
              />
            </label>
            <button className="button primary" type="submit">Save branding</button>
          </form>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employees</div>
          <h2>Create employee profiles.</h2>
          <p className="editor-copy">
            Employees get an email invite to create their password and open their business pass page.
          </p>
          <form action={addEmployee} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <div className="editor-grid">
              <label className="editor-label">
                Name
                <input className="editor-input" name="name" required />
              </label>
              <label className="editor-label">
                Title
                <input className="editor-input" name="title" />
              </label>
            </div>
            <div className="editor-grid">
              <label className="editor-label">
                Email
                <input className="editor-input" name="email" type="email" />
              </label>
              <label className="editor-label">
                Phone
                <input className="editor-input" name="phone" type="tel" />
              </label>
            </div>
            <button className="button primary" type="submit">Add employee</button>
          </form>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Permanent tokens</div>
          <h2>Issue a card/pass token.</h2>
          <form action={issueToken} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <div className="editor-grid">
              <label className="editor-label">
                Assign to employee
                <select className="editor-input" name="assigned_member_id" defaultValue="">
                  <option value="">Leave unassigned</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="editor-label">
                Token type
                <select className="editor-input" name="token_type" defaultValue="both">
                  <option value="both">NFC card + digital pass</option>
                  <option value="nfc_card">NFC card</option>
                  <option value="digital_pass">Digital pass</option>
                </select>
              </label>
            </div>
            <button className="button primary" type="submit">Create token</button>
          </form>
        </div>
      </section>

      <section className="dashboard-wrap" id="business-tokens">
        <div className="dashboard-grid">
          {tokens.map((token) => {
            const member = token.assigned_member_id ? memberById.get(token.assigned_member_id) : null;
            const url = tokenUrl(token.token);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(url)}`;

            return (
              <article className="dashboard-card" key={token.id}>
                <span id={`token-${token.id}`} />
                <div className="dashboard-kicker">{token.token_type.replace("_", " ")}</div>
                <h2>{member?.name || "Unassigned token"}</h2>
                <p className="editor-copy">
                  {member?.title || "Permanent URL"} · {token.status}
                </p>
                <div className="pass-qr-frame" style={{ maxWidth: 220 }}>
                  <img src={qrUrl} alt={`QR code for ${url}`} />
                </div>
                <p className="editor-copy" style={{ wordBreak: "break-all" }}>{url}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="button secondary" href={`/p/${token.token}`}>Open</Link>
                  <CopyLinkButton value={url} />
                  <button className="button secondary" type="button" disabled aria-disabled="true">
                    Add/save digital pass
                  </button>
                </div>
                <form action={updateTokenAssignment} className="editor-form" style={{ marginTop: 16 }}>
                  <input type="hidden" name="organization_id" value={organization.id} />
                  <input type="hidden" name="token_id" value={token.id} />
                  <label className="editor-label">
                    Reassign token
                    <select className="editor-input" name="assigned_member_id" defaultValue={token.assigned_member_id || ""}>
                      <option value="">Unassigned</option>
                      {activeMembers.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button secondary" type="submit">Save assignment</button>
                </form>
                <form action={deactivateToken} style={{ marginTop: 10 }}>
                  <input type="hidden" name="organization_id" value={organization.id} />
                  <input type="hidden" name="token_id" value={token.id} />
                  <button className="button secondary" type="submit">Deactivate token</button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employee status</div>
          <h2>View, manage, or deactivate employees.</h2>
          <div className="status-list">
            {members.map((member) => {
              const assignedToken = tokens.find((token) => token.assigned_member_id === member.id);
              const assignedProfileUrl = assignedToken ? tokenUrl(assignedToken.token) : null;
              return (
                <div className="status-row" key={member.id}>
                  <span className="status-person">
                    <strong>{member.name}</strong>
                    <small>
                      {member.role === "admin" ? "Business admin" : member.title || "Member"} · {assignedToken ? `/p/${assignedToken.token}` : "No token"}
                      {member.email ? ` · ${member.email}` : ""}
                    </small>
                  </span>
                  <strong className="status-pill">{member.status}</strong>
                  <div className="status-actions">
                    {assignedToken ? (
                      <>
                        <Link className="button secondary" href={`/p/${assignedToken.token}`}>
                          View profile
                        </Link>
                        <Link className="button secondary" href={`#token-${assignedToken.id}`}>
                          Manage profile
                        </Link>
                        {assignedProfileUrl ? <CopyLinkButton value={assignedProfileUrl} /> : null}
                      </>
                    ) : (
                      <Link className="button secondary" href="#business-tokens">
                        Assign token
                      </Link>
                    )}
                    {member.status === "active" && member.email ? (
                      <form action={sendBusinessLoginInvite}>
                        <input type="hidden" name="organization_id" value={organization.id} />
                        <input type="hidden" name="member_id" value={member.id} />
                        <button className="button secondary" type="submit">Send login email</button>
                      </form>
                    ) : null}
                    {member.status === "active" ? (
                      <form action={deactivateEmployee}>
                        <input type="hidden" name="organization_id" value={organization.id} />
                        <input type="hidden" name="member_id" value={member.id} />
                        <button className="button secondary" type="submit">Deactivate</button>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}
