import { z } from "zod"

export const customerAccountSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  email: z.union([z.email(), z.literal("")]).optional(),
  notes: z.string().trim().max(1000).optional(),
})
