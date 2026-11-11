import "server-only"

import { auth } from "../auth"
import { requireMembership } from "./require-membership"
import { hasTenantPermission, type TenantPermission } from "./permissions"
import { withTenantContext } from "../database-context"

export async function requireAdminContext(
  slug: string,
  permission: TenantPermission = "viewAdminPanel",
) {
  const membership = await requireMembership(slug)
  if (!membership || !hasTenantPermission(membership.role, permission))
    return null

  const session = await auth()
  if (!session?.user?.id) return null

  const professional =
    membership.role === "PROFESSIONAL"
      ? await withTenantContext(
          membership.barbershopId,
          (tx) =>
            tx.professional.findFirst({
              where: {
                userId: session.user.id,
                barbershopId: membership.barbershopId,
                status: "ACTIVE",
              },
              select: { id: true },
            }),
          session.user.id,
        )
      : null
  if (membership.role === "PROFESSIONAL" && !professional) return null

  return {
    ...membership,
    professionalId: professional?.id ?? null,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
}
