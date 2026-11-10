import "server-only"

import { db } from "@/app/_lib/prisma"
import { resolveTenantBySlug } from "@/app/_lib/tenant/resolve-tenant"
import { cache } from "react"

export const getPublicBarbershop = cache(async (slug: string) => {
  const tenant = await resolveTenantBySlug(slug)
  if (!tenant) return null

  const barbershop = await db.barbershop.findFirst({
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
  })

  return barbershop ? { ...barbershop, ...tenant } : null
})
