import type { BusinessRole, OrganizationMemberRecord } from "@/lib/types";

export const LEGACY_BUSINESS_ROLES = ["owner", "admin", "member"] as const;
export const BUSINESS_ROLES = ["super_admin", "business_admin", "location_admin", "employee"] as const;

export type BusinessPermissionScope = {
  role: BusinessRole;
  legacyRole: OrganizationMemberRecord["role"];
  canManageAllLocations: boolean;
  canManageAllEmployees: boolean;
  canManageBilling: boolean;
  canManageBranding: boolean;
  canAccessLocationScope: boolean;
  locationId: string | null;
};

export function normalizeBusinessRole(role?: string | null): BusinessRole {
  switch (role) {
    case "owner":
    case "super_admin":
      return "super_admin";
    case "admin":
    case "business_admin":
      return "business_admin";
    case "location_admin":
      return "location_admin";
    default:
      return "employee";
  }
}

export function legacyRoleForBusinessRole(role: BusinessRole): OrganizationMemberRecord["role"] {
  switch (role) {
    case "super_admin":
      return "owner";
    case "business_admin":
      return "admin";
    case "location_admin":
    case "employee":
      return "member";
  }
}

export function businessRoleLabel(role?: string | null) {
  switch (normalizeBusinessRole(role)) {
    case "super_admin":
      return "Super admin";
    case "business_admin":
      return "Business admin";
    case "location_admin":
      return "Location admin";
    case "employee":
      return "Employee";
  }
}

export function businessRoleSet(includeLegacy = true) {
  return includeLegacy ? [...LEGACY_BUSINESS_ROLES, ...BUSINESS_ROLES] : [...BUSINESS_ROLES];
}

export function buildBusinessPermissionScope({
  role,
  locationId = null
}: {
  role?: string | null;
  locationId?: string | null;
}): BusinessPermissionScope {
  const normalizedRole = normalizeBusinessRole(role);
  return {
    role: normalizedRole,
    legacyRole: legacyRoleForBusinessRole(normalizedRole),
    canManageAllLocations: normalizedRole === "super_admin" || normalizedRole === "business_admin",
    canManageAllEmployees: normalizedRole === "super_admin" || normalizedRole === "business_admin",
    canManageBilling: normalizedRole === "super_admin",
    canManageBranding: normalizedRole === "super_admin",
    canAccessLocationScope: normalizedRole === "location_admin",
    locationId: normalizedRole === "location_admin" ? locationId : null
  };
}

