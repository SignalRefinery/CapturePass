import { redirect } from "next/navigation";
import { claimBusinessOrganizationForUser } from "@/lib/business/organization-access";
import { buildBusinessPermissionScope } from "@/lib/business/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCapturePassAdmin } from "@/lib/auth/admin";
import type {
  OrganizationMemberRecord,
  BusinessLocationRecord,
  BusinessRegionRecord,
  OrganizationRecord,
  OrganizationWebhookRecord,
  WebhookDeliveryRecord,
  ContactSubmissionRecord,
  AnalyticsEventRecord,
  PassTokenRecord
} from "@/lib/types";

export type BusinessData = {
  organization: OrganizationRecord | null;
  viewerAccess: ReturnType<typeof buildBusinessPermissionScope> | null;
  members: OrganizationMemberRecord[];
  locations: BusinessLocationRecord[];
  regions: BusinessRegionRecord[];
  tokens: PassTokenRecord[];
  contacts: ContactSubmissionRecord[];
  analyticsEvents: AnalyticsEventRecord[];
  webhookSettings: OrganizationWebhookRecord | null;
  webhookDeliveries: WebhookDeliveryRecord[];
};

type BusinessSummary = {
  organization: OrganizationRecord;
  memberCount: number;
  tokenCount: number;
  activeTokenCount: number;
  locationCount: number;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getBusinessAccessScope({
  organizationId,
  allowLocationAdmin = false
}: {
  organizationId: string;
  allowLocationAdmin?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isPlatformAdmin = !!(await getCurrentCapturePassAdmin());

  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (!organization) redirect("/dashboard/business");
  if (organization.owner_user_id === user.id || isPlatformAdmin) {
    return {
      user,
      organization,
      member: null,
      scope: buildBusinessPermissionScope({ role: "super_admin" })
    };
  }

  const { data: member } = await admin
    .from("organization_members")
    .select("id, role, location_id, status, user_id, name, email")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in(
      "role",
      allowLocationAdmin
        ? ["owner", "admin", "super_admin", "business_admin", "location_admin"]
        : ["owner", "admin", "super_admin", "business_admin"]
    )
    .maybeSingle();

  if (!member) redirect("/dashboard/business");

  return {
    user,
    organization,
    member,
    scope: buildBusinessPermissionScope({
      role: member.role,
      locationId: member.location_id || null
    })
  };
}

export async function getBusinessIndex(): Promise<BusinessSummary[]> {
  const admin = createAdminClient();
  const [{ data: organizations }, { data: members }, { data: tokens }, { data: locations }] = await Promise.all([
    admin.from("organizations").select("*").order("created_at", { ascending: false }),
    admin.from("organization_members").select("organization_id, status"),
    admin.from("pass_tokens").select("organization_id, status"),
    admin.from("business_locations").select("business_id")
  ]);

  return ((organizations || []) as OrganizationRecord[]).map((organization) => {
    const orgMembers = (members || []).filter((member) => member.organization_id === organization.id);
    const orgTokens = (tokens || []).filter((token) => token.organization_id === organization.id);
    const orgLocations = (locations || []).filter((location) => location.business_id === organization.id);

    return {
      organization,
      memberCount: orgMembers.length,
      tokenCount: orgTokens.length,
      activeTokenCount: orgTokens.filter((token) => token.status === "active").length,
      locationCount: orgLocations.length
    };
  });
}

export async function getBusinessData(
  userId: string,
  email?: string | null,
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<BusinessData> {
  const admin = createAdminClient();
  let viewerAccess: ReturnType<typeof buildBusinessPermissionScope> | null = null;

  if (organizationId) {
    const { data: requestedOrg } = await admin
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();

    if (!requestedOrg) {
      return {
        organization: null,
        viewerAccess: null,
        locations: [],
        regions: [],
        members: [],
        tokens: [],
        contacts: [],
        analyticsEvents: [],
        webhookSettings: null,
        webhookDeliveries: []
      };
    }

    if (!isPlatformAdmin) {
      const { data: allowedMember } = await admin
        .from("organization_members")
        .select("id, role, location_id")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .eq("status", "active")
        .in("role", ["owner", "admin", "super_admin", "business_admin", "location_admin"])
        .maybeSingle();

      if (requestedOrg.owner_user_id !== userId && !allowedMember) {
        return {
          organization: null,
          viewerAccess: null,
          locations: [],
          regions: [],
          members: [],
          tokens: [],
          contacts: [],
          analyticsEvents: [],
          webhookSettings: null,
          webhookDeliveries: []
        };
      }

      viewerAccess = allowedMember
        ? buildBusinessPermissionScope({
            role: allowedMember.role,
            locationId: allowedMember.location_id || null
          })
        : null;
    }

    if (!viewerAccess && requestedOrg.owner_user_id === userId) {
      viewerAccess = buildBusinessPermissionScope({ role: "super_admin" });
    }

    const [
      { data: locations },
      { data: regions },
      { data: members },
      { data: tokens },
      { data: contacts },
      { data: analyticsEvents },
      { data: webhookSettings },
      { data: webhookDeliveries }
    ] = await Promise.all([
      admin
        .from("business_locations")
        .select("*")
        .eq("business_id", requestedOrg.id)
        .order("created_at", { ascending: true }),
      admin
        .from("business_regions")
        .select("*")
        .eq("business_id", requestedOrg.id)
        .order("created_at", { ascending: true }),
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
        .order("created_at", { ascending: false }),
      admin
        .from("organization_webhooks")
        .select("id, organization_id, enabled, webhook_url, webhook_secret, created_at, updated_at")
        .eq("organization_id", requestedOrg.id)
        .maybeSingle(),
      admin
        .from("webhook_deliveries")
        .select("*")
        .eq("organization_id", requestedOrg.id)
        .order("attempted_at", { ascending: false })
        .limit(25)
    ]);

    return {
      organization: requestedOrg as OrganizationRecord,
      viewerAccess: isPlatformAdmin ? buildBusinessPermissionScope({ role: "super_admin" }) : viewerAccess,
      locations: (locations || []) as BusinessLocationRecord[],
      regions: (regions || []) as BusinessRegionRecord[],
      members: (members || []) as OrganizationMemberRecord[],
      tokens: (tokens || []) as PassTokenRecord[],
      contacts: (contacts || []) as ContactSubmissionRecord[],
      analyticsEvents: (analyticsEvents || []) as AnalyticsEventRecord[],
      webhookSettings: (webhookSettings as OrganizationWebhookRecord | null) || null,
      webhookDeliveries: (webhookDeliveries || []) as WebhookDeliveryRecord[]
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
      .in("role", ["owner", "admin", "super_admin", "business_admin"])
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
    return {
      organization: null,
      viewerAccess: null,
      locations: [],
      regions: [],
      members: [],
      tokens: [],
      contacts: [],
      analyticsEvents: [],
      webhookSettings: null,
      webhookDeliveries: []
    };
  }

  const [
    { data: locations },
    { data: regions },
    { data: members },
    { data: tokens },
    { data: contacts },
    { data: analyticsEvents },
    { data: webhookSettings },
    { data: webhookDeliveries }
  ] = await Promise.all([
    admin
      .from("business_locations")
      .select("*")
      .eq("business_id", organization.id)
      .order("created_at", { ascending: true }),
    admin
      .from("business_regions")
      .select("*")
      .eq("business_id", organization.id)
      .order("created_at", { ascending: true }),
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
      .order("created_at", { ascending: false }),
    admin
      .from("organization_webhooks")
      .select("id, organization_id, enabled, webhook_url, webhook_secret, created_at, updated_at")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    admin
      .from("webhook_deliveries")
      .select("*")
      .eq("organization_id", organization.id)
      .order("attempted_at", { ascending: false })
      .limit(25)
  ]);

  const { data: viewerMember } = await admin
    .from("organization_members")
    .select("id, role, location_id, status")
    .eq("organization_id", organization.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  viewerAccess = viewerMember
    ? buildBusinessPermissionScope({
        role: viewerMember.role,
        locationId: viewerMember.location_id || null
      })
    : buildBusinessPermissionScope({
        role: organization.owner_user_id === userId ? "super_admin" : "employee"
      });

  return {
    organization,
    viewerAccess,
    locations: (locations || []) as BusinessLocationRecord[],
    regions: (regions || []) as BusinessRegionRecord[],
    members: (members || []) as OrganizationMemberRecord[],
    tokens: (tokens || []) as PassTokenRecord[],
    contacts: (contacts || []) as ContactSubmissionRecord[],
    analyticsEvents: (analyticsEvents || []) as AnalyticsEventRecord[],
    webhookSettings: (webhookSettings as OrganizationWebhookRecord | null) || null,
    webhookDeliveries: (webhookDeliveries || []) as WebhookDeliveryRecord[]
  };
}
