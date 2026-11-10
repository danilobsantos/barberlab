import { BarbershopStatus } from "@prisma/client"
import { z } from "zod"

export const platformBarbershopStatusSchema = z.object({
  barbershopId: z.uuid(),
  status: z.enum([BarbershopStatus.ACTIVE, BarbershopStatus.SUSPENDED]),
})
