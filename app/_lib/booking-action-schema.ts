import { z } from "zod"

export const serviceIdSchema = z.string().min(1).max(100)

export const createBookingSchema = z.object({
  serviceId: serviceIdSchema,
  professionalId: serviceIdSchema,
  date: z.iso.date(),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
})

export const unavailableIntervalsSchema = z.object({
  serviceId: serviceIdSchema,
  professionalId: serviceIdSchema,
  date: z.iso.date(),
})
