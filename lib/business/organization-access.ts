import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationMemberRecord, OrganizationRecord } from "@/lib/types";

type BusinessRole = OrganizationMemberRecord["role"];

export async function claimBusinessMembershipForUser({
  userId,
  email,
  organizationId,
  roles = ["owner", "admin", "member"]
}: {
  userId: string;
  email?: string | null;
  organizationId?: string | null;
  roles?: BusinessRole[];
}) {
  const normalizedEmail = (email || "").trim();

  if (!normalizedEmail) return null;

  const admin = createAdminClient();
  let query = admin
    .from("organization_members")
    .select("id, organization_id, user_id, name, email, phone, title, role, status, headshot_url, organization:organizations(*)")
    .ilike("email", normalizedEmail)
    .eq("status", "active")
    .in("role", roles)
    .limit(1);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: member } = await query.maybeSingle();

  if (!member) return null;
  if (member.user_id && member.user_id !== userId) return null;

  if (!member.user_id) {
    await admin
      .from("organization_members")
      .update({ user_id: userId })
      .eq("id", member.id);
  }

  const organization = Array.isArray(member.organization)
    ? member.organization[0]
    : member.organization;

  if (!organization) return null;

  return {
    organization: organization as OrganizationRecord,
    member: {
      id: member.id,
      organization_id: member.organization_id,
      user_id: userId,
      name: member.name,
      email: member.email,
      headshot_url: member.headshot_url,
      phone: member.phone,
      title: member.title,
      role: member.role,
      status: member.status
    } as OrganizationMemberRecord
  };
}

export async function claimBusinessOrganizationForUser({
  userId,
  email,
  organizationId,
  roles = ["owner", "admin"]
}: {
  userId: string;
  email?: string | null;
  organizationId?: string | null;
  roles?: BusinessRole[];
}) {
  const result = await claimBusinessMembershipForUser({
    userId,
    email,
    organizationId,
    roles
  });

  return result?.organization || null;
}
