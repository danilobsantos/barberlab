"use server"

import { db } from "../_lib/prisma"
import { SINGLE_BARBERSHOP_ID } from "../_lib/deployment"

export const getBarbershopsById = async () => {
  if (!SINGLE_BARBERSHOP_ID) return null

  return db.barbershop.findFirst({
    where: { id: SINGLE_BARBERSHOP_ID, status: "ACTIVE" },
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
  })
}
