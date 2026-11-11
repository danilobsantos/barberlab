"use server"

import nodemailer from "nodemailer"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/app/_lib/prisma"
import { withTenantContext } from "@/app/_lib/database-context"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import {
  createInvitationToken,
  hashInvitationToken,
  isInvitationOwner,
  MEMBERSHIP_INVITATION_DAYS,
  membershipInvitationExpiresAt,
  normalizeInvitationEmail,
} from "@/app/_lib/membership-invitation"

const professionalIdSchema = z.uuid()

const revalidateTeam = (slug: string) => {
  revalidatePath(`/painel/${slug}/team`)
  revalidatePath(`/team`)
}

const inviteUrl = (token: string) =>
  new URL(
    `/convite/${token}`,
    process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  ).toString()

async function sendInvitationEmail({
  email,
  professionalName,
  barbershopName,
  url,
}: {
  email: string
  professionalName: string
  barbershopName: string
  url: string
}) {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) return false

  try {
    const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER)
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Convite para a equipe de ${barbershopName}`,
      text: `${professionalName}, você foi convidado para acessar a equipe de ${barbershopName}. Entre ou crie sua conta com este e-mail e aceite o convite em até ${MEMBERSHIP_INVITATION_DAYS} dias: ${url}`,
    })
    return true
  } catch (error) {
    console.error("[membership-invitation] email delivery failed", error)
    return false
  }
}

export async function sendProfessionalInvitation(
  professionalId: unknown,
  slug: string,
) {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin || !isInvitationOwner(admin.role)) {
    return {
      ok: false as const,
      error: "Somente o dono pode convidar profissionais.",
    }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsedId = professionalIdSchema.safeParse(professionalId)
  if (!parsedId.success) {
    return { ok: false as const, error: "Profissional não encontrado." }
  }

  const professional = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.professional.findFirst({
        where: { id: parsedId.data, barbershopId: admin.barbershopId },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          userId: true,
          barbershop: { select: { name: true } },
          invitation: { select: { acceptedAt: true } },
        },
      }),
    admin.userId,
  )
  if (!professional || professional.status !== "ACTIVE") {
    return { ok: false as const, error: "Profissional ativo não encontrado." }
  }
  if (professional.userId) {
    return {
      ok: false as const,
      error: "Este profissional já está vinculado a uma conta.",
    }
  }
  if (professional.invitation?.acceptedAt) {
    return { ok: false as const, error: "Este convite já foi aceito." }
  }
  if (!professional.email) {
    return {
      ok: false as const,
      error: "Cadastre o e-mail do profissional antes de convidá-lo.",
    }
  }

  const token = createInvitationToken()
  const now = new Date()
  const expiresAt = membershipInvitationExpiresAt(now)
  const email = normalizeInvitationEmail(professional.email)
  const url = inviteUrl(token)

  try {
    await withTenantContext(
      admin.barbershopId,
      () =>
        db.$transaction(async (tx) => {
          const current = await tx.professionalInvitation.findUnique({
            where: { professionalId: professional.id },
            select: { id: true, acceptedAt: true },
          })
          if (current?.acceptedAt)
            throw new Error("INVITATION_ALREADY_ACCEPTED")

          await tx.professionalInvitation.upsert({
            where: { professionalId: professional.id },
            create: {
              professionalId: professional.id,
              barbershopId: admin.barbershopId,
              email,
              tokenHash: hashInvitationToken(token),
              expiresAt,
            },
            update: {
              email,
              tokenHash: hashInvitationToken(token),
              expiresAt,
              canceledAt: null,
            },
          })
          const saved = await tx.professionalInvitation.findUnique({
            where: { professionalId: professional.id },
            select: { acceptedAt: true },
          })
          if (saved?.acceptedAt) throw new Error("INVITATION_ALREADY_ACCEPTED")
        }),
      admin.userId,
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVITATION_ALREADY_ACCEPTED"
    ) {
      return { ok: false as const, error: "Este convite já foi aceito." }
    }
    throw error
  }

  const emailSent = await sendInvitationEmail({
    email,
    professionalName: professional.name,
    barbershopName: professional.barbershop.name,
    url,
  })
  revalidateTeam(slug)
  return { ok: true as const, url, emailSent }
}

export async function cancelProfessionalInvitation(
  professionalId: unknown,
  slug: string,
) {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin || !isInvitationOwner(admin.role)) {
    return {
      ok: false as const,
      error: "Somente o dono pode cancelar convites.",
    }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsedId = professionalIdSchema.safeParse(professionalId)
  if (!parsedId.success) {
    return { ok: false as const, error: "Convite não encontrado." }
  }

  const canceled = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.professionalInvitation.updateMany({
        where: {
          professionalId: parsedId.data,
          acceptedAt: null,
          canceledAt: null,
          professional: { barbershopId: admin.barbershopId },
        },
        data: { canceledAt: new Date() },
      }),
    admin.userId,
  )
  if (!canceled.count) {
    return { ok: false as const, error: "Convite pendente não encontrado." }
  }

  revalidateTeam(slug)
  return { ok: true as const }
}
