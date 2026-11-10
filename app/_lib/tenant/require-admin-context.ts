import "server-only"

import { auth } from "../auth"
import { requireMembership } from "./require-membership"
import { hasTenantPermission, type TenantPermission } from "./permissions"

export async function requireAdminContext(
  slug: string,
  permission: TenantPermission = "viewAdminPanel",
) {
  const membership = await requireMembership(slug)
  if (!membership || !hasTenantPermission(membership.role, permission))
    return null

  const session = await auth()
  if (!session?.user?.id) return null

  return {
    ...membership,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
}
