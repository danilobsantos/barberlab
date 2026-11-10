import { z } from "zod"

const reservedSlugs = new Set([
  "painel",
  "api",
  "login",
  "cadastro",
  "precos",
  "barbershops",
  "bookings",
  "dashboard",
  "schedule",
  "services",
  "settings",
  "carreiras",
  "contato",
  "cookies",
  "parceiros",
  "perfil",
  "privacidade",
  "sobre",
  "termos",
])

export const barbershopRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia.").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras, números e hífens.")
    .refine(
      (slug) => !reservedSlugs.has(slug),
      "Este endereço está reservado.",
    ),
  address: z.string().trim().min(5, "Informe um endereço válido.").max(200),
  phone: z
    .string()
    .trim()
    .transform((phone) => phone.replace(/\D/g, ""))
    .refine(
      (phone) => phone.length >= 10 && phone.length <= 13,
      "Informe um telefone válido com DDD.",
    ),
})

export type BarbershopRegistrationInput = z.infer<
  typeof barbershopRegistrationSchema
>
