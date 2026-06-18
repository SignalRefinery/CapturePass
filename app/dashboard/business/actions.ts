"use server";

import { redirect } from "next/navigation";
import { recordAnalyticsEvent } from "@/lib/analytics/record-event";
import {
  BUSINESS_HEADSHOT_MAX_BYTES,
  BUSINESS_LOGO_MAX_BYTES,
  deleteBusinessAssetUrl,
  uploadBusinessAsset
} from "@/lib/business/assets";
import { BUSINESS_PLANS, getBusinessPlan, normalizeBusinessBillingInterval } from "@/lib/business/plans";
import { BUSINESS_TYPES, normalizeBusinessType } from "@/lib/business-types";
import { getBusinessAccessScope, getCurrentUser } from "@/lib/business/dashboard-data";
import {
  businessInviteRedirectUrl,
  cleanBrandTheme,
  cleanEmail,
  cleanHexColor,
  cleanId,
  cleanLocationState,
  cleanOptionalId,
  cleanStateCodes,
  cleanText,
  cleanTokenStatus,
  cleanUrl,
  digitalPassUrl,
  escapeHtml,
  isPlatformAdminMember,
  passVcardUrl,
  tokenUrl
} from "@/lib/business/dashboard-utils";
import { normalizeBusinessRole } from "@/lib/business/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildEmployeeWebhookPayload, generateWebhookSecret, normalizeWebhookUrl, queueOrganizationWebhook } from "@/lib/webhooks/sendWebhook";
import { slugify } from "@/lib/utils";
import { generatePrivateToken } from "@/lib/utils/generate-token";
import { CUSTOM_THEME_KEY, normalizeThemeKey } from "@/lib/themes";
import { getCurrentTapTaggAdmin, TAPTAGG_BOOTSTRAP_ADMIN_EMAIL } from "@/lib/auth/admin";
import type { OrganizationMemberRecord, OrganizationRecord } from "@/lib/types";

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

async function requireBusinessAdmin(organizationId: string, allowLocationAdmin = false) {
  "use server";

  const access = await getBusinessAccessScope({ organizationId, allowLocationAdmin });
  if (access.scope.role === "location_admin" && !allowLocationAdmin) {
    redirect("/dashboard/business");
  }

  return access.user;
}

function businessActionRedirect(organizationId?: string | null, error = "invalid_business_action", anchor = "") {
  const orgQuery = organizationId ? `?org=${organizationId}&error=${error}` : `?error=${error}`;
  redirect(`/dashboard/business${orgQuery}${anchor}`);
}

function requiredOrganizationId(formData: FormData, anchor = "") {
  const organizationId = cleanId(formData.get("organization_id"));
  if (!organizationId) businessActionRedirect(null, "invalid_business_action", anchor);
  return organizationId;
}

function requiredId(formData: FormData, field: string, organizationId: string, anchor = "") {
  const id = cleanId(formData.get(field));
  if (!id) businessActionRedirect(organizationId, "invalid_business_action", anchor);
  return id;
}

export async function createOrganization(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isPlatformAdmin = !!(await getCurrentTapTaggAdmin());
  if (!isPlatformAdmin) redirect("/business");

  const name = String(formData.get("name") || "").trim();
  const adminName = String(formData.get("admin_name") || "").trim();
  const adminEmail = cleanEmail(formData.get("admin_email"));
  const adminPhone = String(formData.get("admin_phone") || "").trim();
  const adminTitle = String(formData.get("admin_title") || "").trim();
  const locationName = String(formData.get("location_name") || "").trim();
  const locationSlug = String(formData.get("location_slug") || "").trim().toLowerCase();
  const locationAddress = cleanText(formData.get("location_address"));
  const locationCity = cleanText(formData.get("location_city"));
  const locationState = cleanLocationState(formData.get("location_state"));
  const locationPhone = cleanText(formData.get("location_phone"));
  const businessPlan = getBusinessPlan(String(formData.get("business_plan_key") || "")) || BUSINESS_PLANS.business_starter_self;
  const businessBillingInterval = normalizeBusinessBillingInterval(String(formData.get("business_billing_interval") || ""));
  const promoCode = String(formData.get("promo_code") || "").trim().toUpperCase();
  const isFounderDemo = promoCode === "FOUNDERS";

  if (!name) redirect("/dashboard/business?error=missing_org_name");
  if (!adminName) redirect("/dashboard/business?error=missing_admin_name");

  const admin = createAdminClient();
  const slug = await generateUniqueOrganizationSlug(name);
  const { data: organization, error } = await admin
    .from("organizations")
    .insert({
      name,
      slug,
      theme_key: "taptagg_brand",
      business_type: "general_business",
      owner_user_id: user.id,
      managed_service_enabled: businessPlan.managed,
      business_plan_key: businessPlan.key,
      business_billing_interval: businessBillingInterval,
      seat_limit: businessPlan.seatLimit,
      included_card_count: businessPlan.includedCards,
      card_allotment_total: businessPlan.includedCards,
      is_managed: businessPlan.managed,
      ...(isFounderDemo
        ? {
            subscription_status: "active",
            setup_fee_paid_at: new Date().toISOString()
          }
        : {})
    })
    .select("id, name, slug")
    .single();

  if (error || !organization) redirect("/dashboard/business?error=org_create_failed");

  const { data: businessAdminMember } = await admin
    .from("organization_members")
    .insert({
      organization_id: organization.id,
      name: adminName,
      email: adminEmail,
      phone: adminPhone || null,
      title: adminTitle || null,
      role: "business_admin",
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

  if (adminEmail !== TAPTAGG_BOOTSTRAP_ADMIN_EMAIL) {
    await admin.from("organization_members").insert({
      organization_id: organization.id,
      name: "CapturePass Admin",
      email: TAPTAGG_BOOTSTRAP_ADMIN_EMAIL,
      title: "Platform admin",
      role: "super_admin",
      status: "active"
    });
  }

  if (locationName) {
    const resolvedLocationSlug = locationSlug || (await generateUniqueBusinessLocationSlug(organization.id, locationName));
    const { error: locationError } = await admin.from("business_locations").insert({
      business_id: organization.id,
      name: locationName,
      slug: resolvedLocationSlug,
      address: locationAddress,
      city: locationCity,
      state: locationState,
      phone: locationPhone,
      region_id: null
    });

    if (locationError) {
      console.error("Initial business location create failed", {
        organizationId: organization.id,
        error: locationError.message
      });
      redirect("/dashboard/business?error=location_save_failed");
    }
  }

  redirect(`/dashboard/business?org=${organization.id}`);
}

async function generateUniqueBusinessLocationSlug(businessId: string, name: string) {
  const admin = createAdminClient();
  const base = slugify(name) || `location-${generatePrivateToken(6)}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data: existingLocation } = await admin
      .from("business_locations")
      .select("id")
      .eq("business_id", businessId)
      .eq("slug", candidate)
      .maybeSingle();

    if (!existingLocation) return candidate;
  }

  return `${base}-${generatePrivateToken(6)}`;
}

export async function saveBusinessRegion(formData: FormData) {
  "use server";

  const businessId = requiredOrganizationId(formData, "#business-locations");
  await requireBusinessAdmin(businessId);

  const regionId = cleanOptionalId(formData.get("region_id"));
  const name = String(formData.get("name") || "").trim();
  const description = cleanText(formData.get("description"));
  const stateCodes = cleanStateCodes(formData.get("state_codes"));
  const admin = createAdminClient();

  if (!name) redirect(`/dashboard/business?org=${businessId}&error=region_name_required#business-locations`);

  const payload = {
    business_id: businessId,
    name,
    description,
    state_codes: stateCodes.length ? stateCodes : null
  };

  const { error } = regionId
    ? await admin.from("business_regions").update(payload).eq("id", regionId).eq("business_id", businessId)
    : await admin.from("business_regions").insert(payload);

  if (error) {
    console.error("Business region save failed", { businessId, regionId, error: error.message });
    redirect(`/dashboard/business?org=${businessId}&error=region_save_failed#business-locations`);
  }

  redirect(`/dashboard/business?org=${businessId}&saved=region#business-locations`);
}

export async function saveBusinessLocation(formData: FormData) {
  "use server";

  const businessId = requiredOrganizationId(formData, "#business-locations");
  const locationId = cleanOptionalId(formData.get("location_id"));
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const address = cleanText(formData.get("address"));
  const city = cleanText(formData.get("city"));
  const state = cleanLocationState(formData.get("state"));
  const phone = cleanText(formData.get("phone"));
  const regionId = cleanOptionalId(formData.get("region_id"));
  const admin = createAdminClient();
  const access = await getBusinessAccessScope({ organizationId: businessId, allowLocationAdmin: true });

  if (!name) redirect(`/dashboard/business?org=${businessId}&error=location_name_required#business-locations`);
  const { data: currentLocation } = locationId
    ? await admin
        .from("business_locations")
        .select("id, region_id")
        .eq("id", locationId)
        .eq("business_id", businessId)
        .maybeSingle()
    : { data: null };

  if (access.scope.role === "location_admin") {
    if (!locationId || access.scope.locationId !== locationId) {
      redirect(`/dashboard/business?org=${businessId}&error=platform_admin_locked#business-locations`);
    }
    if (regionId) {
      redirect(`/dashboard/business?org=${businessId}&error=platform_admin_locked#business-locations`);
    }
  }

  const resolvedSlug = slug || (locationId ? null : await generateUniqueBusinessLocationSlug(businessId, name));
  const payload = {
    business_id: businessId,
    name,
    slug: resolvedSlug,
    address,
    city,
    state,
    phone,
    region_id:
      access.scope.role === "location_admin"
        ? (currentLocation?.region_id || null)
        : regionId || null
  };

  const { error } = locationId
    ? await admin.from("business_locations").update(payload).eq("id", locationId).eq("business_id", businessId)
    : await admin.from("business_locations").insert(payload);

  if (error) {
    console.error("Business location save failed", { businessId, locationId, error: error.message });
    redirect(`/dashboard/business?org=${businessId}&error=location_save_failed#business-locations`);
  }

  redirect(`/dashboard/business?org=${businessId}&saved=location#business-locations`);
}

export async function deleteBusinessLocation(formData: FormData) {
  "use server";

  const businessId = requiredOrganizationId(formData, "#business-locations");
  await requireBusinessAdmin(businessId);

  const locationId = requiredId(formData, "location_id", businessId, "#business-locations");
  const admin = createAdminClient();

  await admin.from("organization_members").update({ location_id: null }).eq("location_id", locationId).eq("organization_id", businessId);

  const { error } = await admin.from("business_locations").delete().eq("id", locationId).eq("business_id", businessId);
  if (error) {
    console.error("Business location delete failed", { businessId, locationId, error: error.message });
    redirect(`/dashboard/business?org=${businessId}&error=location_save_failed#business-locations`);
  }

  redirect(`/dashboard/business?org=${businessId}&saved=location_deleted#business-locations`);
}

export async function updateEmployeeLocation(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const locationId = cleanOptionalId(formData.get("location_id"));
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, email")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (locationId) {
    const { data: location } = await admin
      .from("business_locations")
      .select("id")
      .eq("id", locationId)
      .eq("business_id", organizationId)
      .maybeSingle();

    if (!location) {
      redirect(`/dashboard/business?org=${organizationId}&error=location_save_failed#business-locations`);
    }
  }

  const { error } = await admin
    .from("organization_members")
    .update({ location_id: locationId })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Business employee location update failed", { organizationId, memberId, error: error.message });
    redirect(`/dashboard/business?org=${organizationId}&error=location_save_failed#business-employees`);
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=member_location#business-employees`);
}

export async function updateOrganizationBranding(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-branding");
  await requireBusinessAdmin(organizationId);

  const admin = createAdminClient();
  const { data: currentOrganization } = await admin
    .from("organizations")
    .select("brand_logo_url")
    .eq("id", organizationId)
    .maybeSingle();
  const themeKey = normalizeThemeKey(String(formData.get("theme_key") || ""));
  const useCustomColors = themeKey === CUSTOM_THEME_KEY;
  const logoFile = formData.get("brand_logo_file");
  let brandLogoUrl = (currentOrganization?.brand_logo_url as string | null) || null;

  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      brandLogoUrl = await uploadBusinessAsset({
        file: logoFile,
        kind: "logo",
        oldUrl: brandLogoUrl,
        organizationId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "logo_upload_failed";
      const errorCode = message === "logo_too_large" || message === "logo_must_be_png"
        ? message
        : "logo_upload_failed";
      redirect(`/dashboard/business?org=${organizationId}&error=${errorCode}#business-branding`);
    }
  }

  const brandingPayload = {
    theme_key: themeKey,
    brand_theme: cleanBrandTheme(themeKey),
    brand_color_primary: useCustomColors ? cleanHexColor(formData.get("brand_color_primary")) : null,
    brand_color_secondary: useCustomColors ? cleanHexColor(formData.get("brand_color_secondary")) : null,
    brand_color_accent: useCustomColors ? cleanHexColor(formData.get("brand_color_accent")) : null,
    brand_color_background: useCustomColors ? cleanHexColor(formData.get("brand_color_background")) : null,
    brand_color_text: useCustomColors ? cleanHexColor(formData.get("brand_color_text")) : null,
    brand_color: useCustomColors ? cleanHexColor(formData.get("brand_color_primary")) : null,
    brand_logo_url: brandLogoUrl
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

export async function updateOrganizationBusinessType(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-settings");
  await requireBusinessAdmin(organizationId);

  const businessType = normalizeBusinessType(String(formData.get("business_type") || ""));
  const admin = createAdminClient();

  const { error } = await admin
    .from("organizations")
    .update({ business_type: businessType })
    .eq("id", organizationId);

  if (error) {
    console.error("Business type save failed", {
      organizationId,
      businessType,
      error: error.message
    });
    redirect(`/dashboard/business?org=${organizationId}&error=business_type_save_failed#business-settings`);
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=business_type#business-settings`);
}

export async function deleteBusinessLogo(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-branding");
  await requireBusinessAdmin(organizationId);

  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("brand_logo_url")
    .eq("id", organizationId)
    .maybeSingle();

  await deleteBusinessAssetUrl((organization?.brand_logo_url as string | null) || null);
  await admin
    .from("organizations")
    .update({ brand_logo_url: null })
    .eq("id", organizationId);

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

export async function addEmployee(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const name = String(formData.get("name") || "").trim();
  const email = cleanEmail(formData.get("email"));
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
        email,
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
    queueOrganizationWebhook({
      organizationId,
      event: "employee.activated",
      payload: buildEmployeeWebhookPayload({
        event: "employee.activated",
        organization,
        employee: member,
        status: "active"
      })
    });
    if (!inviteResult.sent && email) {
      redirect(`/dashboard/business?org=${organizationId}&error=business_invite_send_failed`);
    }
  }

  redirect(`/dashboard/business?org=${organizationId}`);
}

export async function sendBusinessLoginInvite(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  const access = await getBusinessAccessScope({ organizationId, allowLocationAdmin: true });

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const admin = createAdminClient();
  const [{ data: organization }, { data: member }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, slug")
      .eq("id", organizationId)
      .maybeSingle(),
    admin
      .from("organization_members")
      .select("id, name, email, role, location_id")
      .eq("id", memberId)
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (!organization || !member?.email) {
    redirect(`/dashboard/business?org=${organizationId}&error=missing_member_email`);
  }

  if (access.scope.role === "location_admin" && member.location_id !== access.scope.locationId) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
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

export async function updateEmployeeHeadshot(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  const access = await getBusinessAccessScope({ organizationId, allowLocationAdmin: true });

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const headshotFile = formData.get("headshot_file");
  if (!(headshotFile instanceof File) || headshotFile.size === 0) {
    redirect(`/dashboard/business?org=${organizationId}&error=headshot_upload_failed`);
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("id, email, headshot_url, location_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!member || isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (access.scope.role === "location_admin" && member.location_id !== access.scope.locationId) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  let headshotUrl: string | null = null;
  try {
    headshotUrl = await uploadBusinessAsset({
      file: headshotFile,
      kind: "headshot",
      memberId,
      oldUrl: (member.headshot_url as string | null) || null,
      organizationId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "headshot_upload_failed";
    const errorCode = message === "headshot_too_large" || message === "headshot_invalid_type"
      ? message
      : "headshot_upload_failed";
    redirect(`/dashboard/business?org=${organizationId}&error=${errorCode}`);
  }

  await admin
    .from("organization_members")
    .update({ headshot_url: headshotUrl })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

export async function deleteEmployeeHeadshot(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  const access = await getBusinessAccessScope({ organizationId, allowLocationAdmin: true });

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("id, email, headshot_url, location_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!member || isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (access.scope.role === "location_admin" && member.location_id !== access.scope.locationId) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  await deleteBusinessAssetUrl((member.headshot_url as string | null) || null);
  await admin
    .from("organization_members")
    .update({ headshot_url: null })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

export async function sendBusinessDigitalPass(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const tokenId = requiredId(formData, "token_id", organizationId, "#business-employees");
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

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
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
      from: process.env.INTERNAL_FROM_EMAIL || "CapturePass <noreply@capturepass.com>",
      to: member.email,
      subject: `Your ${organization.name} CapturePass digital pass`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2 style="margin:0 0 16px;">Your CapturePass digital pass is ready</h2>
          <p style="margin:0 0 18px;">
            ${escapeHtml(organization.name)} has assigned a CapturePass digital pass to ${escapeHtml(member.name)}.
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
  let locationId: string | null = null;
  let regionId: string | null = null;

  if (memberId) {
    const { data: member } = await admin
      .from("organization_members")
      .select("location_id")
      .eq("id", memberId)
      .maybeSingle();

    locationId = member?.location_id || null;

    if (locationId) {
      const { data: location } = await admin
        .from("business_locations")
        .select("id, region_id")
        .eq("id", locationId)
        .maybeSingle();
      locationId = location?.id || null;
      regionId = location?.region_id || null;
    }
  }

  await recordAnalyticsEvent({
    event_type: eventType,
    organization_id: organizationId,
    organization_member_id: memberId || null,
    location_id: locationId,
    region_id: regionId,
    card_id: cardId || null,
    source: "dashboard_preview",
    action_label: label || null,
    metadata: {}
  }, {
    client: admin,
    logLabel: "Business analytics event insert failed",
    logContext: {
      organizationId,
      memberId,
      eventType
    }
  });
}

export async function saveOrganizationWebhooks(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-automations");
  await requireBusinessAdmin(organizationId);

  const enabled = formData.get("enabled") === "on";
  const webhookUrl = normalizeWebhookUrl(formData.get("webhook_url") as string | null);

  if (enabled && !webhookUrl) {
    redirect(`/dashboard/business?org=${organizationId}&error=webhook_url_required#business-automations`);
  }

  const admin = createAdminClient();
  const { data: existingSettings } = await admin
    .from("organization_webhooks")
    .select("id, webhook_secret")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { error } = await admin.from("organization_webhooks").upsert(
    {
      organization_id: organizationId,
      enabled,
      webhook_url: webhookUrl,
      webhook_secret: (existingSettings?.webhook_secret as string | null) || generateWebhookSecret()
    },
    {
      onConflict: "organization_id"
    }
  );

  if (error) {
    console.error("Business webhook settings save failed", {
      organizationId,
      error: error.message,
      enabled,
      webhookUrl
    });
    redirect(`/dashboard/business?org=${organizationId}&error=webhook_save_failed#business-automations`);
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=webhooks#business-automations`);
}

export async function regenerateOrganizationWebhookSecret(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-automations");
  await requireBusinessAdmin(organizationId);

  const admin = createAdminClient();
  const { data: existingSettings } = await admin
    .from("organization_webhooks")
    .select("enabled, webhook_url")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { error } = await admin.from("organization_webhooks").upsert(
    {
      organization_id: organizationId,
      enabled: existingSettings?.enabled ?? false,
      webhook_url: existingSettings?.webhook_url || null,
      webhook_secret: generateWebhookSecret()
    },
    {
      onConflict: "organization_id"
    }
  );

  if (error) {
    console.error("Business webhook secret regeneration failed", {
      organizationId,
      error: error.message
    });
    redirect(`/dashboard/business?org=${organizationId}&error=webhook_secret_failed#business-automations`);
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=webhook_secret#business-automations`);
}

export async function issueToken(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const assignedMemberId = cleanOptionalId(formData.get("assigned_member_id"));
  const tokenType = "both";
  const token = await generateUniqueToken();
  const admin = createAdminClient();

  if (assignedMemberId) {
    const { data: assignedMember } = await admin
      .from("organization_members")
      .select("id, email")
      .eq("id", assignedMemberId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!assignedMember || isPlatformAdminMember(assignedMember)) {
      redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
    }
  }

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

export async function updateTokenAssignment(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const tokenId = requiredId(formData, "token_id", organizationId, "#business-employees");
  const assignedMemberId = cleanOptionalId(formData.get("assigned_member_id"));
  const admin = createAdminClient();

  if (assignedMemberId) {
    const { data: assignedMember } = await admin
      .from("organization_members")
      .select("id, email")
      .eq("id", assignedMemberId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!assignedMember || isPlatformAdminMember(assignedMember)) {
      redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
    }
  }

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

export async function deactivateToken(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const tokenId = requiredId(formData, "token_id", organizationId, "#business-employees");
  const assignedMemberId = cleanOptionalId(formData.get("assigned_member_id"));
  const status = cleanTokenStatus(formData.get("status"));
  const admin = createAdminClient();

  if (status === "unassigned") {
    await admin
      .from("pass_tokens")
      .update({
        assigned_member_id: null,
        status: "unassigned"
      })
      .eq("id", tokenId)
      .eq("organization_id", organizationId);

    redirect(`/dashboard/business?org=${organizationId}`);
  }

  if (status === "active" && assignedMemberId) {
    const { data: assignedMember } = await admin
      .from("organization_members")
      .select("id, email")
      .eq("id", assignedMemberId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!assignedMember || isPlatformAdminMember(assignedMember)) {
      redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
    }

    await admin
      .from("pass_tokens")
      .update({
        assigned_member_id: assignedMemberId,
        status: "active"
      })
      .eq("id", tokenId)
      .eq("organization_id", organizationId);

    redirect(`/dashboard/business?org=${organizationId}`);
  }

  await admin
    .from("pass_tokens")
    .update({ status: "inactive" })
    .eq("id", tokenId)
    .eq("organization_id", organizationId);

  redirect(`/dashboard/business?org=${organizationId}`);
}

export async function updateEmployeeRole(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  await requireBusinessAdmin(organizationId);

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const requestedRole = String(formData.get("role") || "member");
  const normalizedRole = normalizeBusinessRole(requestedRole);
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, email")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  await admin
    .from("organization_members")
    .update({ role: normalizedRole })
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .neq("role", "owner");

  redirect(`/dashboard/business?org=${organizationId}`);
}

export async function updateEmployeeProfile(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  const access = await getBusinessAccessScope({ organizationId, allowLocationAdmin: true });

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const nextName = String(formData.get("name") || "").trim();
  const rawEmail = String(formData.get("email") || "").trim();
  const nextEmail = rawEmail ? cleanEmail(rawEmail) : null;
  const nextPhone = cleanText(formData.get("phone"));
  const admin = createAdminClient();

  if (!nextName) {
    redirect(`/dashboard/business?org=${organizationId}&error=missing_employee_name#business-employees`);
  }

  if (rawEmail && !nextEmail) {
    redirect(`/dashboard/business?org=${organizationId}&error=member_profile_failed#business-employees`);
  }

  const { data: member } = await admin
    .from("organization_members")
    .select("id, user_id, name, email, role, status, location_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!member) {
    redirect(`/dashboard/business?org=${organizationId}&error=member_not_found`);
  }

  if (access.scope.role === "location_admin" && member.location_id !== access.scope.locationId) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  const currentEmail = (member.email || "").trim().toLowerCase();
  const emailChanged = nextEmail !== currentEmail;

  const { data: organization } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", organizationId)
    .maybeSingle();

  if (!organization) {
    redirect(`/dashboard/business?org=${organizationId}&error=member_profile_failed#business-employees`);
  }

  const { error } = await admin
    .from("organization_members")
    .update({
      name: nextName,
      email: nextEmail,
      phone: nextPhone
    })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Business member profile update failed", {
      organizationId,
      memberId,
      error: error.message
    });
    redirect(`/dashboard/business?org=${organizationId}&error=member_profile_failed#business-employees`);
  }

  if (member.user_id && emailChanged && nextEmail) {
    const { error: authError } = await admin.auth.admin.updateUserById(member.user_id, {
      email: nextEmail,
      email_confirm: true
    });

    if (authError) {
      console.error("Business member auth email update failed", {
        organizationId,
        memberId,
        userId: member.user_id,
        error: authError.message
      });
      redirect(`/dashboard/business?org=${organizationId}&error=member_profile_failed#business-employees`);
    }
  }

  if (emailChanged && nextEmail) {
    const inviteResult = await sendBusinessInviteEmail({
      organization,
      member: {
        id: member.id,
        name: nextName,
        email: nextEmail,
        role: member.role
      }
    });

    if (!inviteResult.sent) {
      redirect(`/dashboard/business?org=${organizationId}&error=business_invite_send_failed#business-employees`);
    }
  }

  redirect(`/dashboard/business?org=${organizationId}&saved=member_profile#business-employees`);
}

export async function updateEmployeeStatus(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  const access = await getBusinessAccessScope({ organizationId, allowLocationAdmin: true });
  const user = access.user;

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const requestedStatus = String(formData.get("status") || "inactive");
  const status = requestedStatus === "active" ? "active" : "inactive";
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, user_id, name, email, role, status, location_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (access.scope.role === "location_admin" && member?.location_id !== access.scope.locationId) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (
    member?.user_id === user.id &&
    member.status === "active" &&
    ["super_admin", "business_admin"].includes(normalizeBusinessRole(member.role))
  ) {
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

  if (member) {
    const { data: organization } = await admin.from("organizations").select("id, name").eq("id", organizationId).maybeSingle();
    if (organization) {
      queueOrganizationWebhook({
        organizationId,
        event: status === "active" ? "employee.activated" : "employee.deactivated",
        payload: buildEmployeeWebhookPayload({
          event: status === "active" ? "employee.activated" : "employee.deactivated",
          organization,
          employee: member,
          status
        })
      });
    }
  }

  if (status === "inactive") {
    await admin
      .from("pass_tokens")
      .update({ status: "inactive" })
      .eq("assigned_member_id", memberId)
      .eq("organization_id", organizationId);
  }

  redirect(`/dashboard/business?org=${organizationId}`);
}

export async function deleteEmployee(formData: FormData) {
  "use server";

  const organizationId = requiredOrganizationId(formData, "#business-employees");
  const user = await requireBusinessAdmin(organizationId);

  const memberId = requiredId(formData, "member_id", organizationId, "#business-employees");
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("id, user_id, email, role, status")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (isPlatformAdminMember(member)) {
    redirect(`/dashboard/business?org=${organizationId}&error=platform_admin_locked`);
  }

  if (
    member?.user_id === user.id &&
    member.status === "active" &&
    ["super_admin", "business_admin"].includes(normalizeBusinessRole(member.role))
  ) {
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
