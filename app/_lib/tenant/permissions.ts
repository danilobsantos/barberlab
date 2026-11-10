import type { MembershipRole } from "@prisma/client"

export type TenantPermission =
  | "viewAdminPanel"
  | "manageBookings"
  | "manageSchedule"
  | "manageServices"
  | "manageTeam"
  | "manageSettings"

const ROLE_PERMISSIONS: Record<MembershipRole, readonly TenantPermission[]> = {
  OWNER: [
    "viewAdminPanel",
    "manageBookings",
    "manageSchedule",
    "manageServices",
    "manageTeam",
    "manageSettings",
  ],
  MANAGER: [
    "viewAdminPanel",
    "manageBookings",
    "manageSchedule",
    "manageServices",
    "manageTeam",
  ],
  PROFESSIONAL: ["viewAdminPanel", "manageBookings"],
}

export const hasTenantPermission = (
  role: MembershipRole,
  permission: TenantPermission,
) => ROLE_PERMISSIONS[role].includes(permission)
