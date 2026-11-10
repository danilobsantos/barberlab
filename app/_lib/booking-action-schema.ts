import { z } from "zod"

export const serviceIdSchema = z.string().min(1).max(100)
export const publicSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const publicBookingTenantFilter = (
  slug: string | undefined,
  singleTenantId: string | null,
) =>
  singleTenantId
    ? { id: singleTenantId, ...(slug ? { slug } : {}) }
    : slug
      ? { slug }
      : null

export const serviceInputSchema = z.union([
  serviceIdSchema,
  z.object({ serviceId: serviceIdSchema, slug: publicSlugSchema.optional() }),
])

export const createBookingSchema = z.object({
  serviceId: serviceIdSchema,
  professionalId: serviceIdSchema,
  date: z.iso.date(),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  slug: publicSlugSchema.optional(),
})

export const unavailableIntervalsSchema = z.object({
  serviceId: serviceIdSchema,
  professionalId: serviceIdSchema,
  date: z.iso.date(),
  slug: publicSlugSchema.optional(),
})
