import { redirect } from "next/navigation";
import Link from "next/link";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { ContactTable } from "@/components/contacts/contact-table";
import { BusinessBrandThemeFields } from "@/components/business/business-brand-theme-fields";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { BusinessGamificationPanel } from "@/components/gamification/gamification-panels";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { Shell } from "@/components/shared/shell";
import { claimBusinessOrganizationForUser } from "@/lib/business/organization-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationGamificationSummary } from "@/lib/gamification/server";
import { slugify } from "@/lib/utils";
import { generatePrivateToken } from "@/lib/utils/generate-token";
import { CUSTOM_THEME_KEY, normalizeThemeKey, isHexColor } from "@/lib/themes";
import type {
  OrganizationMemberRecord,
  OrganizationRecord,
  ContactSubmissionRecord,
  AnalyticsEventRecord,
  PassTokenRecord
} from "@/lib/types";

type BusinessData = {
  organization: OrganizationRecord | null;
  members: OrganizationMemberRecord[];
  tokens: PassTokenRecord[];
  contacts: ContactSubmissionRecord[];
  analyticsEvents: AnalyticsEventRecord[];
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
  return isHexColor(color) ? color : null;
}

function cleanBrandTheme(value: FormDataEntryValue | null) {
  const theme = normalizeThemeKey(String(value || ""));
  if (theme === "clean_horizon" || theme === "sage_professional") return "clean_light";
  if (theme === "custom") return "custom";
  return "deep_brand";
}

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim() || null;
}

function cleanUrl(value: FormDataEntryValue | null) {
  const url = String(value || "").trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function businessErrorMessage(error?: string) {
  switch (error) {
    case "branding_save_failed":
      return "Branding did not save. Confirm the business branding Supabase SQL has been run, then try again.";
    case "business_links_save_failed":
      return "Colors and logo saved, but business links did not. Run phase72_business_global_links.sql in Supabase, then save again.";
    case "missing_member_email":
      return "That person needs an email address before a login invite can be sent.";
    case "business_invite_send_failed":
      return "The login invite could not be sent. Check Supabase Auth email settings, allowed redirect URLs, and the member email address.";
    case "digital_pass_send_failed":
      return "Digital pass email could not be sent. Confirm the employee has an active assigned token and email address, then try again.";
    case "cannot_remove_self":
      return "You cannot archive or delete your own active admin access from this table.";
    case "member_delete_failed":
      return "That business user could not be deleted. Try archiving them instead.";
    case "missing_org_name":
      return "Company name is required.";
    case "missing_admin_name":
      return "Business admin name is required.";
    case "missing_employee_name":
      return "Employee name is required.";
    default:
      return "Please complete the required business fields and try again.";
  }
}

function tokenUrl(token: string) {
  return `${appUrl()}/p/${token}`;
}

function digitalPassUrl(token: string) {
  return `${appUrl()}/pass/business/${token}`;
}

function passVcardUrl(token: string) {
  return `${appUrl()}/api/pass-vcard/${token}`;
}

function escapeHtml(value?: string | null) {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function businessLoginPath(slug?: string | null) {
  return slug ? `/${slug}/login` : "/dashboard/business";
}

function businessLoginUrl(slug?: string | null) {
  return `${appUrl()}${businessLoginPath(slug)}`;
}

function businessInviteRedirectUrl(slug?: string | null) {
  const passwordUrl = new URL("/update-password", appUrl());
  passwordUrl.searchParams.set("next", businessLoginPath(slug));
  return passwordUrl.toString();
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
      return { organization: null, members: [], tokens: [], contacts: [], analyticsEvents: [] };
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
        return { organization: null, members: [], tokens: [], contacts: [], analyticsEvents: [] };
      }
    }

    const [{ data: members }, { data: tokens }, { data: contacts }, { data: analyticsEvents }] = await Promise.all([
      admin
        .from("organization_members")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("created_at", { ascending: true }),
      admin
        .from("pass_tokens")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("created_at", { ascending: true }),
      admin
        .from("contact_submissions")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("created_at", { ascending: false }),
      admin
        .from("analytics_events")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("created_at", { ascending: false })
    ]);

    return {
      organization: requestedOrg as OrganizationRecord,
      members: (members || []) as OrganizationMemberRecord[],
      tokens: (tokens || []) as PassTokenRecord[],
      contacts: (contacts || []) as ContactSubmissionRecord[],
      analyticsEvents: (analyticsEvents || []) as AnalyticsEventRecord[]
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
    return { organization: null, members: [], tokens: [], contacts: [], analyticsEvents: [] };
  }

  const [{ data: members }, { data: tokens }, { data: contacts }, { data: analyticsEvents }] = await Promise.all([
    admin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true }),
    admin
      .from("pass_tokens")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true }),
    admin
      .from("contact_submissions")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    admin
      .from("analytics_events")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
  ]);

  return {
    organization,
    members: (members || []) as OrganizationMemberRecord[],
    tokens: (tokens || []) as PassTokenRecord[],
    contacts: (contacts || []) as ContactSubmissionRecord[],
    analyticsEvents: (analyticsEvents || []) as AnalyticsEventRecord[]
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
  const isPlatformAdmin = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  if (!isPlatformAdmin) redirect("/business");

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
      theme_key: "executive_navy",
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
  const themeKey = normalizeThemeKey(String(formData.get("theme_key") || ""));
  const useCustomColors = themeKey === CUSTOM_THEME_KEY;

  const brandingPayload = {
    theme_key: themeKey,
    brand_theme: cleanBrandTheme(themeKey),
    brand_color_primary: useCustomColors ? cleanHexColor(formData.get("brand_color_primary")) : null,
    brand_color_secondary: useCustomColors ? cleanHexColor(formData.get("brand_color_secondary")) : null,
    brand_color_accent: useCustomColors ? cleanHexColor(formData.get("brand_color_accent")) : null,
    brand_color_text: useCustomColors ? cleanHexColor(formData.get("brand_color_text")) : null,
    brand_color: useCustomColors ? cleanHexColor(formData.get("brand_color_primary")) : null,
    brand_logo_url: brandLogoUrl || null
  };

  const linksPayload = {
    business_link_1_title: cleanText(formData.get("business_link_1_title")),
    business_link_1_url: cleanUrl(formData.get("business_link_1_url")),
    business_link_2_title: cleanText(formData.get("business_link_2_title")),
    business_link_2_url: cleanUrl(formData.get("business_link_2_url")),
    business_link_3_title: cleanText(formData.get("business_link_3_title")),
    business_link_3_url: cleanUrl(formData.get("business_link_3_url")),
    business_link_4_title: cleanText(formData.get("business_link_4_title")),
    business_link_4_url: cleanUrl(formData.get("business_link_4_url"))
  };

  const { data: updatedOrganization, error } = await admin
    .from("organizations")
    .update(brandingPayload)
    .eq("id", organizationId)
    .select("id")
    .maybeSingle();

  if (error || !updatedOrganization) {
    console.error("Business branding save failed", {
      organizationId,
      error: error?.message || "No organization updated",
      payload: brandingPayload
    });
    redirect(`/dashboard/business?org=${organizationId}&error=branding_save_failed#business-branding`);
  }

  const { error: linksError } = await admin
    .from("organizations")
    .update(linksPayload)
    .eq("id", organizationId);

  if (linksError) {
    console.error("Business links save failed", {
      organizationId,
      error: linksError.message,
      payload: linksPayload
    });
    redirect(`/dashboard/business?org=${organizationId}&error=business_links_save_failed&saved=branding#business-branding`);
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=branding#business-branding`);
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
    const inviteResult = await sendBusinessInviteEmail({
      organization,
      member: member as Pick<OrganizationMemberRecord, "id" | "name" | "email" | "role">
    });
    await insertBusinessAnalyticsEvent({
      organizationId,
      memberId: member.id,
      eventType: "employee_activated",
      label: member.role
    });
    if (!inviteResult.sent && email) {
      redirect(`/dashboard/business?org=${organizationId}&error=business_invite_send_failed`);
    }
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

  const inviteResult = await sendBusinessInviteEmail({
    organization,
    member: member as Pick<OrganizationMemberRecord, "id" | "name" | "email" | "role">
  });

  if (!inviteResult.sent) {
    redirect(`/dashboard/business?org=${organizationId}&error=business_invite_send_failed`);
  }

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function sendBusinessDigitalPass(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const tokenId = String(formData.get("token_id") || "");
  const admin = createAdminClient();
  const [{ data: organization }, { data: member }, { data: token }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle(),
    admin
      .from("organization_members")
      .select("id, name, email, status")
      .eq("id", memberId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    admin
      .from("pass_tokens")
      .select("id, token, assigned_member_id, status")
      .eq("id", tokenId)
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (
    !organization ||
    !member?.email ||
    member.status !== "active" ||
    !token ||
    token.status !== "active" ||
    token.assigned_member_id !== member.id
  ) {
    redirect(`/dashboard/business?org=${organizationId}&error=digital_pass_send_failed`);
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is missing. Skipping business digital pass email.", {
      organizationId,
      memberId,
      tokenId
    });
    redirect(`/dashboard/business?org=${organizationId}&error=digital_pass_send_failed`);
  }

  const publicPassUrl = tokenUrl(token.token);
  const saveablePassUrl = digitalPassUrl(token.token);
  const contactCardUrl = passVcardUrl(token.token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.INTERNAL_FROM_EMAIL || "TapTagg <noreply@taptagg.app>",
      to: member.email,
      subject: `Your ${organization.name} TapTagg digital pass`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2 style="margin:0 0 16px;">Your TapTagg digital pass is ready</h2>
          <p style="margin:0 0 18px;">
            ${escapeHtml(organization.name)} has assigned a TapTagg digital pass to ${escapeHtml(member.name)}.
          </p>
          <p style="margin:0 0 12px;">
            <a href="${escapeHtml(saveablePassUrl)}" style="display:inline-block;background:#111827;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;">
              Save digital pass
            </a>
          </p>
          <p style="margin:0 0 18px;">
            To save the contact card, open this link: <a href="${escapeHtml(contactCardUrl)}">${escapeHtml(contactCardUrl)}</a>
          </p>
          <p style="margin:0 0 8px;color:#555;">Digital pass: ${escapeHtml(saveablePassUrl)}</p>
          <p style="margin:0;color:#555;">Public profile: ${escapeHtml(publicPassUrl)}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Business digital pass email failed", {
      organizationId,
      memberId,
      tokenId,
      error: errorText
    });
    redirect(`/dashboard/business?org=${organizationId}&error=digital_pass_send_failed`);
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=digital_pass_sent`);
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

async function insertBusinessAnalyticsEvent({
  organizationId,
  memberId,
  cardId,
  eventType,
  label
}: {
  organizationId: string;
  memberId?: string | null;
  cardId?: string | null;
  eventType: "card_assigned" | "card_reassigned" | "employee_activated" | "employee_deactivated";
  label?: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("analytics_events").insert({
    event_type: eventType,
    organization_id: organizationId,
    organization_member_id: memberId || null,
    card_id: cardId || null,
    source: "dashboard_preview",
    action_label: label || null,
    metadata: {}
  }).then(({ error }) => {
    if (error) {
      console.error("Business analytics event insert failed", {
        organizationId,
        memberId,
        eventType,
        error: error.message
      });
    }
  });
}

async function issueToken(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const assignedMemberId = String(formData.get("assigned_member_id") || "") || null;
  const tokenType = "both";
  const token = await generateUniqueToken();
  const admin = createAdminClient();

  const { data: insertedToken } = await admin.from("pass_tokens").insert({
    organization_id: organizationId,
    token,
    assigned_member_id: assignedMemberId,
    status: assignedMemberId ? "active" : "unassigned",
    token_type: tokenType
  }).select("id").maybeSingle();

  if (assignedMemberId) {
    await insertBusinessAnalyticsEvent({
      organizationId,
      memberId: assignedMemberId,
      cardId: insertedToken?.id || null,
      eventType: "card_assigned",
      label: tokenType
    });
  }

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

  await insertBusinessAnalyticsEvent({
    organizationId,
    memberId: assignedMemberId,
    cardId: tokenId,
    eventType: "card_reassigned",
    label: assignedMemberId ? "assigned" : "unassigned"
  });

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

async function updateEmployeeRole(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const requestedRole = String(formData.get("role") || "member");
  const role = requestedRole === "admin" ? "admin" : "member";
  const admin = createAdminClient();

  await admin
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .neq("role", "owner");

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function updateEmployeeStatus(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  const user = await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const requestedStatus = String(formData.get("status") || "inactive");
  const status = requestedStatus === "active" ? "active" : "inactive";
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, user_id, role, status")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (member?.user_id === user.id && member.status === "active" && (member.role === "owner" || member.role === "admin")) {
    redirect(`/dashboard/business?org=${organizationId}&error=cannot_remove_self`);
  }

  await admin
    .from("organization_members")
    .update({ status })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  await insertBusinessAnalyticsEvent({
    organizationId,
    memberId,
    eventType: status === "active" ? "employee_activated" : "employee_deactivated"
  });

  if (status === "inactive") {
    await admin
      .from("pass_tokens")
      .update({ status: "inactive" })
      .eq("assigned_member_id", memberId)
      .eq("organization_id", organizationId);
  }

  redirect(`/dashboard/business?org=${organizationId}`);
}

async function deleteEmployee(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  const user = await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("id, user_id, role, status")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (member?.user_id === user.id && member.status === "active" && (member.role === "owner" || member.role === "admin")) {
    redirect(`/dashboard/business?org=${organizationId}&error=cannot_remove_self`);
  }

  await admin
    .from("pass_tokens")
    .update({
      assigned_member_id: null,
      status: "unassigned"
    })
    .eq("assigned_member_id", memberId)
    .eq("organization_id", organizationId);

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Business member delete failed", {
      organizationId,
      memberId,
      error: error.message
    });
    redirect(`/dashboard/business?org=${organizationId}&error=member_delete_failed`);
  }

  redirect(`/dashboard/business?org=${organizationId}`);
}

export default async function BusinessDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; org?: string; onboard?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const isPlatformAdmin = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const selectedOrganizationId = params?.org || null;
  const showOnboarding = isPlatformAdmin && params?.onboard === "1";
  const businessIndex = isPlatformAdmin ? await getBusinessIndex() : [];
  const { organization, members, tokens, contacts, analyticsEvents } = showOnboarding
    ? { organization: null, members: [], tokens: [], contacts: [], analyticsEvents: [] }
    : await getBusinessData(user.id, user.email, selectedOrganizationId, isPlatformAdmin);
  const gamificationSummary = organization
    ? await getOrganizationGamificationSummary({ organizationId: organization.id })
    : null;
  const initialAuth = {
    email: user.email || null,
    fullName: user.user_metadata?.full_name || null,
    slug: null
  };
  const businessNavLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/business#leaderboard", label: "Leaderboard" },
    { href: "/dashboard/business#challenges", label: "Challenges" },
    { href: "/dashboard/business#competitions", label: "Competitions" }
  ];

  if (isPlatformAdmin && !selectedOrganizationId && !showOnboarding) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
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
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
        <section className="simple-hero">
          <div className="dashboard-card" style={{ maxWidth: 780, margin: "0 auto" }}>
            {isPlatformAdmin ? (
              <>
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
                  <Link className="button secondary" href="/dashboard/business">
                    Back to business accounts
                  </Link>
                </form>
              </>
            ) : (
              <>
                <div className="dashboard-kicker">Business quote</div>
                <h1>Business accounts are created by TapTagg.</h1>
                <p>
                  Business TapTagg is currently quote-based. Request a business quote and we will set up
                  the company console, admin login, employees, branding, and card/pass tokens.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
                  <Link className="button primary" href="/business#business-request">
                    Request business quote
                  </Link>
                  <Link className="button secondary" href="/dashboard/business">
                    Refresh business access
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </Shell>
    );
  }

  const activeMembers = members.filter((member) => member.status === "active");
  const memberById = new Map(members.map((member) => [member.id, member]));
  const unassignedTokens = tokens.filter((token) => !token.assigned_member_id || !memberById.has(token.assigned_member_id));

  return (
    <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
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
            <p className="editor-copy">{businessErrorMessage(params.error)}</p>
          </div>
        </section>
      ) : null}
      {params?.saved === "branding" ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card pass-alert">
            <div className="dashboard-kicker">Saved</div>
            <p className="editor-copy">Business branding was saved.</p>
          </div>
        </section>
      ) : null}
      {params?.saved === "digital_pass_sent" ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card pass-alert">
            <div className="dashboard-kicker">Sent</div>
            <p className="editor-copy">Digital pass email was sent.</p>
          </div>
        </section>
      ) : null}

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employee status</div>
          <h2>View, manage, archive, or delete employees.</h2>
          <p className="editor-copy">
            Token links, assignments, and deactivation live in this table so each employee can be managed in one place.
          </p>
          <div className="admin-table-frame business-member-table">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role / title</th>
                    <th>Email</th>
                    <th>Token</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const assignedToken = tokens.find((token) => token.assigned_member_id === member.id);
                    const assignedProfileUrl = assignedToken ? tokenUrl(assignedToken.token) : null;
                    return (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.name}</strong>
                        </td>
                        <td>
                          {member.role === "owner" ? (
                            <div>
                              <strong>Owner</strong>
                              <div className="table-subtext">{member.title || "Business owner"}</div>
                            </div>
                          ) : (
                            <form action={updateEmployeeRole} className="table-actions">
                              <input type="hidden" name="organization_id" value={organization.id} />
                              <input type="hidden" name="member_id" value={member.id} />
                              <select
                                className="editor-input"
                                name="role"
                                defaultValue={member.role === "admin" ? "admin" : "member"}
                                aria-label={`Role for ${member.name}`}
                              >
                                <option value="member">Employee</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button className="button secondary" type="submit">Save role</button>
                              {member.title ? <span className="table-subtext">{member.title}</span> : null}
                            </form>
                          )}
                        </td>
                        <td>{member.email || "—"}</td>
                        <td>
                          {assignedToken && assignedProfileUrl ? (
                            <div>
                              <strong>{assignedToken.token_type.replace("_", " ")}</strong>
                              <div className="table-subtext">{assignedProfileUrl}</div>
                            </div>
                          ) : (
                            "No token"
                          )}
                        </td>
                        <td>
                          <span className="status-pill">{member.status}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {assignedToken ? (
                              <>
                                <Link className="button secondary" href={`/pass/business/${assignedToken.token}`}>
                                  View digital pass
                                </Link>
                                {assignedProfileUrl ? <CopyLinkButton value={assignedProfileUrl} /> : null}
                                {member.email && member.status === "active" && assignedToken.status === "active" ? (
                                  <form action={sendBusinessDigitalPass}>
                                    <input type="hidden" name="organization_id" value={organization.id} />
                                    <input type="hidden" name="member_id" value={member.id} />
                                    <input type="hidden" name="token_id" value={assignedToken.id} />
                                    <button className="button secondary" type="submit">Send digital pass</button>
                                  </form>
                                ) : (
                                  <button className="button secondary" type="button" disabled aria-disabled="true">
                                    Send digital pass
                                  </button>
                                )}
                                <form action={updateTokenAssignment} className="table-actions">
                                  <input type="hidden" name="organization_id" value={organization.id} />
                                  <input type="hidden" name="token_id" value={assignedToken.id} />
                                  <select
                                    className="editor-input"
                                    name="assigned_member_id"
                                    defaultValue={assignedToken.assigned_member_id || ""}
                                    aria-label={`Reassign ${member.name}'s token`}
                                  >
                                    <option value="">Unassigned</option>
                                    {activeMembers.map((candidate) => (
                                      <option key={candidate.id} value={candidate.id}>
                                        {candidate.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button className="button secondary" type="submit">Save</button>
                                </form>
                                <form action={deactivateToken}>
                                  <input type="hidden" name="organization_id" value={organization.id} />
                                  <input type="hidden" name="token_id" value={assignedToken.id} />
                                  <button className="button secondary" type="submit">Deactivate token</button>
                                </form>
                              </>
                            ) : member.status === "active" ? (
                              <form action={issueToken} className="table-actions">
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="assigned_member_id" value={member.id} />
                                <button className="button secondary" type="submit">Issue token</button>
                              </form>
                            ) : (
                              <span className="editor-copy">Activate employee to issue a token.</span>
                            )}
                            {member.status === "active" && member.email ? (
                              <form action={sendBusinessLoginInvite}>
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="member_id" value={member.id} />
                                <button className="button secondary" type="submit">Invite</button>
                              </form>
                            ) : null}
                            {member.status === "active" ? (
                              <form action={updateEmployeeStatus}>
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="member_id" value={member.id} />
                                <input type="hidden" name="status" value="inactive" />
                                <ConfirmSubmitButton
                                  className="button secondary"
                                  confirmMessage={`Archive ${member.name}? Their assigned token will be deactivated.`}
                                >
                                  Archive
                                </ConfirmSubmitButton>
                              </form>
                            ) : (
                              <form action={updateEmployeeStatus}>
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="member_id" value={member.id} />
                                <input type="hidden" name="status" value="active" />
                                <button className="button secondary" type="submit">Restore</button>
                              </form>
                            )}
                            <form action={deleteEmployee}>
                              <input type="hidden" name="organization_id" value={organization.id} />
                              <input type="hidden" name="member_id" value={member.id} />
                              <ConfirmSubmitButton
                                className="button secondary"
                                confirmMessage={`Permanently delete ${member.name}? This will unassign their token and remove them from the business table.`}
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {unassignedTokens.map((token) => {
                    const url = tokenUrl(token.token);

                    return (
                      <tr key={token.id}>
                        <td>
                          <strong>Unassigned token</strong>
                        </td>
                        <td>{token.token_type.replace("_", " ")}</td>
                        <td>—</td>
                        <td>
                          <strong>{`/p/${token.token}`}</strong>
                          <div className="table-subtext">{url}</div>
                        </td>
                        <td>
                          <span className="status-pill">{token.status}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <CopyLinkButton value={url} />
                            <form action={updateTokenAssignment} className="table-actions">
                              <input type="hidden" name="organization_id" value={organization.id} />
                              <input type="hidden" name="token_id" value={token.id} />
                              <select
                                className="editor-input"
                                name="assigned_member_id"
                                defaultValue=""
                                aria-label="Assign unassigned token"
                              >
                                <option value="">Unassigned</option>
                                {activeMembers.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>
                                    {candidate.name}
                                  </option>
                                ))}
                              </select>
                              <button className="button secondary" type="submit">Save</button>
                            </form>
                            <form action={deactivateToken}>
                              <input type="hidden" name="organization_id" value={organization.id} />
                              <input type="hidden" name="token_id" value={token.id} />
                              <button className="button secondary" type="submit">Deactivate token</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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

      <section className="dashboard-wrap" id="business-contacts">
        <ContactTable contacts={contacts} members={members} showMemberFilter />
      </section>

      <AnalyticsSummary events={analyticsEvents} contacts={contacts} members={members} business />

      {gamificationSummary ? <BusinessGamificationPanel summary={gamificationSummary} organizationId={organization.id} /> : null}

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

      <section className="dashboard-wrap" id="business-branding">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Business branding</div>
          <h2>Customize pass pages.</h2>
            <p className="editor-copy">
            These colors, logo, and optional links apply to business token pages like /p/token.
          </p>
          <form action={updateOrganizationBranding} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <BusinessBrandThemeFields organization={organization} />
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
            <div>
              <div className="dashboard-kicker">Business web links</div>
              <p className="editor-copy">
                These replace the email/profile URL strip on every employee pass. Empty links stay hidden.
              </p>
            </div>
            {[1, 2, 3, 4].map((index) => {
              const titleKey = `business_link_${index}_title` as keyof OrganizationRecord;
              const urlKey = `business_link_${index}_url` as keyof OrganizationRecord;
              return (
                <div className="editor-grid" key={index}>
                  <label className="editor-label">
                    Link {index} label
                    <input
                      className="editor-input"
                      name={`business_link_${index}_title`}
                      placeholder={index === 1 ? "Company website" : "Book a demo"}
                      defaultValue={(organization[titleKey] as string | null) || ""}
                    />
                  </label>
                  <label className="editor-label">
                    Link {index} URL
                    <input
                      className="editor-input"
                      name={`business_link_${index}_url`}
                      type="url"
                      placeholder="https://..."
                      defaultValue={(organization[urlKey] as string | null) || ""}
                    />
                  </label>
                </div>
              );
            })}
            <button className="button primary" type="submit">Save branding</button>
          </form>
        </div>
      </section>
    </Shell>
  );
}
