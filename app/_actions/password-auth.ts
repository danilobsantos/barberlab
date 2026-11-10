"use server"

import { Prisma, Role } from "@prisma/client"
import nodemailer from "nodemailer"
import { randomBytes } from "node:crypto"
import { db } from "@/app/_lib/prisma"
import {
  hashPassword,
  hashPasswordResetToken,
} from "@/app/_lib/password-crypto"
import {
  passwordRegistrationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from "@/app/_lib/password-auth-schema"
import { consumeRateLimit } from "@/app/_lib/rate-limit"

const emailAuthEnabled =
  process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_ENABLED === "true" &&
  !!process.env.EMAIL_SERVER &&
  !!process.env.EMAIL_FROM

const genericResetMessage =
  "Se a conta puder ser recuperada, enviaremos as instruções por e-mail."

export async function registerPasswordAccount(formData: FormData) {
  const parsed = passwordRegistrationSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType"),
  })
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Confira o e-mail e a senha informados.",
    }
  }
  if (!emailAuthEnabled) {
    return {
      ok: false as const,
      error: "Cadastro por e-mail indisponível no momento.",
    }
  }

  const { email, password, accountType } = parsed.data
  const limit = await consumeRateLimit("passwordSignup", email)
  if (!limit.allowed) {
    return {
      ok: false as const,
      error: "Muitas tentativas. Tente novamente mais tarde.",
    }
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existing) return { ok: true as const }

  try {
    await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        accountType,
        role: accountType === "BARBERSHOP" ? Role.BARBER_ADMIN : Role.CUSTOMER,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: true as const }
    }
    console.error("[password-auth] account registration failed", error)
    return { ok: false as const, error: "Não foi possível criar a conta." }
  }

  return { ok: true as const }
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  })
  if (!parsed.success || !emailAuthEnabled) {
    return { ok: true as const, message: genericResetMessage }
  }

  const { email } = parsed.data
  const limit = await consumeRateLimit("passwordReset", email)
  if (!limit.allowed) return { ok: true as const, message: genericResetMessage }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerified: true },
  })
  if (!user?.emailVerified) {
    return { ok: true as const, message: genericResetMessage }
  }

  const token = randomBytes(32).toString("base64url")
  const identifier = `password-reset:${user.id}`
  await db.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier } })
    await tx.verificationToken.create({
      data: {
        identifier,
        token: hashPasswordResetToken(token),
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
  })

  const resetUrl = new URL(
    "/redefinir-senha",
    process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  )
  resetUrl.searchParams.set("email", user.email)
  resetUrl.searchParams.set("token", token)
  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER!)
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Redefinição de senha — BarberLab",
      text: `Use este link para redefinir sua senha (válido por 1 hora): ${resetUrl}`,
    })
  } catch (error) {
    await db.verificationToken.deleteMany({ where: { identifier } })
    console.error("[password-auth] password reset email failed", error)
  }

  return { ok: true as const, message: genericResetMessage }
}

export async function resetPassword(formData: FormData) {
  const parsed = passwordResetSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  })
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "O link ou a senha informada é inválido.",
    }
  }

  const { email, token, password } = parsed.data
  const limit = await consumeRateLimit("passwordReset", email)
  if (!limit.allowed) {
    return {
      ok: false as const,
      error: "Muitas tentativas. Tente novamente mais tarde.",
    }
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  })
  if (!user?.emailVerified) {
    return { ok: false as const, error: "O link expirou ou não é válido." }
  }

  const identifier = `password-reset:${user.id}`
  const tokenHash = hashPasswordResetToken(token)
  const available = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: tokenHash } },
    select: { expires: true },
  })
  if (!available || available.expires <= new Date()) {
    return { ok: false as const, error: "O link expirou ou não é válido." }
  }

  const passwordHash = await hashPassword(password)
  const consumed = await db.$transaction(async (tx) => {
    const result = await tx.verificationToken.deleteMany({
      where: {
        identifier,
        token: tokenHash,
        expires: { gt: new Date() },
      },
    })
    if (result.count !== 1) return false
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, authVersion: { increment: 1 } },
    })
    return true
  })

  return consumed
    ? { ok: true as const }
    : { ok: false as const, error: "O link expirou ou não é válido." }
}
