import { SubscriptionStatus } from "@prisma/client"
import { z } from "zod"

export const subscriptionSchema = z
  .object({
    barbershopId: z.string().min(1),
    planId: z.string().min(1),
    status: z.nativeEnum(SubscriptionStatus),
    currentPeriodStart: z.iso.date(),
    currentPeriodEnd: z.iso.date(),
  })
  .refine(
    ({ currentPeriodStart, currentPeriodEnd }) =>
      currentPeriodEnd > currentPeriodStart,
    {
      path: ["currentPeriodEnd"],
      message: "A data final deve ser posterior à inicial.",
    },
  )

export type SubscriptionInput = z.infer<typeof subscriptionSchema>
