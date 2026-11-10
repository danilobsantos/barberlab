import { z } from "zod"

export const accountTypeSchema = z.enum(["CUSTOMER", "BARBERSHOP"])
const normalizedEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email().max(254),
)

export const passwordCredentialsSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(12).max(128),
  accountType: accountTypeSchema,
})

export const passwordRegistrationSchema = passwordCredentialsSchema

export const passwordResetRequestSchema = z.object({
  email: normalizedEmailSchema,
})

export const passwordResetSchema = z
  .object({
    email: normalizedEmailSchema,
    token: z.string().min(32).max(128),
    password: z.string().min(12).max(128),
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  })
