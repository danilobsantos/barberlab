import "server-only"

import { resolveTenantBySlug } from "@/app/_lib/tenant/resolve-tenant"
import { cache } from "react"
import { withTenantContext } from "@/app/_lib/database-context"

export const getPublicBarbershop = cache(async (slug: string) => {
  const tenant = await resolveTenantBySlug(slug)
  if (!tenant) return null

  const barbershop = await withTenantContext(tenant.id, (tx) =>
    tx.barbershop.findFirst({
      where: { id: tenant.id, status: "ACTIVE" },
      select: {
        name: true,
        address: true,
        phones: true,
        description: true,
        imageUrl: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true,
            durationMinutes: true,
          },
        },
      },
    }),
  )

  return barbershop ? { ...barbershop, ...tenant } : null
})
