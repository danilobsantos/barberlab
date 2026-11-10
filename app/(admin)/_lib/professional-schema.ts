import { z } from "zod"

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable(),
  )

export const professionalSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome.").max(100),
  displayName: optionalText(60),
  email: optionalText(254).pipe(
    z.string().email("Informe um e-mail válido.").nullable(),
  ),
  phone: optionalText(30),
  bio: optionalText(500),
  serviceIds: z
    .array(z.uuid())
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, "Não repita serviços."),
})

export type ProfessionalInput = z.infer<typeof professionalSchema>
