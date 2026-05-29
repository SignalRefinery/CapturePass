import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationRecord } from "@/lib/types";

export async function claimBusinessOrganizationForUser({
  userId,
  email,
  organizationId
}: {
  userId: string;
  email?: string | null;
  organizationId?: string | null;
}) {
  const normalizedEmail = (email || "").trim();

  if (!normalizedEmail) return null;

  const admin = createAdminClient();
  let query = admin
    .from("organization_members")
    .select("id, user_id, organization:organizations(*)")
    .ilike("email", normalizedEmail)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
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

  return (organization as OrganizationRecord | undefined) || null;
}
