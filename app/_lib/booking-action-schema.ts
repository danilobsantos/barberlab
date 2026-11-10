import { z } from "zod"

export const serviceIdSchema = z.string().min(1).max(100)

export const createBookingSchema = z.object({
  serviceId: serviceIdSchema,
  date: z.date(),
})

export const unavailableIntervalsSchema = createBookingSchema
