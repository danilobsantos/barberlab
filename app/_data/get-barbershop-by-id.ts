"use server"

import { SINGLE_BARBERSHOP_ID } from "../_lib/deployment"
import { withTenantContext } from "../_lib/database-context"

export const getBarbershopsById = async () => {
  const barbershopId = SINGLE_BARBERSHOP_ID
  if (!barbershopId) return null

  return withTenantContext(barbershopId, (tx) =>
    tx.barbershop.findFirst({
      where: { id: barbershopId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        address: true,
        phones: true,
        description: true,
        imageUrl: true,
        timezone: true,
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
}
