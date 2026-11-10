import { z } from "zod"

export const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(500),
  priceMonthly: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/),
  maxProfessionals: z
    .string()
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(z.number().int().positive().nullable()),
  features: z
    .string()
    .transform((value) => [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().regex(/^[a-z][a-z0-9_]{1,49}$/)).max(50))
    .transform((features) =>
      Object.fromEntries(features.map((feature) => [feature, true])),
    ),
})

export type PlanInput = z.infer<typeof planSchema>
