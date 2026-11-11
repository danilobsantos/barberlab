"use server"

import { MembershipRole, MembershipStatus } from "@prisma/client"
import { db } from "@/app/_lib/prisma"
import {
  setDatabaseContext,
  withInvitationToken,
} from "@/app/_lib/database-context"
import { auth } from "@/app/_lib/auth"
import { consumeRateLimit } from "@/app/_lib/rate-limit"
import {
  hashInvitationToken,
  invitationTokenSchema,
  isInvitationAcceptable,
  normalizeInvitationEmail,
} from "@/app/_lib/membership-invitation"

export async function acceptMembershipInvitation(input: unknown) {
  const parsedToken = invitationTokenSchema.safeParse(input)
  if (!parsedToken.success) {
    return { ok: false as const, error: "Este link de convite não é válido." }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: "Entre ou crie sua conta para aceitar o convite.",
    }
  }

  const limit = await consumeRateLimit("acceptInvitation", session.user.id)
  if (!limit.allowed) {
    return {
      ok: false as const,
      error: "Muitas tentativas. Tente novamente mais tarde.",
    }
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true },
  })
  if (!user?.emailVerified) {
    return {
      ok: false as const,
      error: "Confirme seu e-mail antes de aceitar o convite.",
    }
  }

  const tokenHash = hashInvitationToken(parsedToken.data)
  const now = new Date()
  const result = await withInvitationToken(tokenHash, user.id, async (tx) => {
    const tokenInvitation = await tx.professionalInvitation.findUnique({
      where: { tokenHash },
      select: { barbershopId: true },
    })
    if (!tokenInvitation) {
      return {
        error: "Este convite expirou, foi cancelado ou não está mais válido.",
      }
    }
    await setDatabaseContext(tx, {
      tenantId: tokenInvitation.barbershopId,
      userId: user.id,
      invitationTokenHash: tokenHash,
    })
    const invitation = await tx.professionalInvitation.findUnique({
      where: { tokenHash },
      include: {
        professional: {
          select: {
            id: true,
            barbershopId: true,
            userId: true,
            email: true,
            status: true,
            barbershop: { select: { slug: true, status: true } },
          },
        },
      },
    })
    if (
      !invitation ||
      !isInvitationAcceptable(invitation, user.email, now) ||
      invitation.professional.status !== "ACTIVE" ||
      invitation.professional.barbershop.status === "SUSPENDED" ||
      invitation.professional.barbershop.status === "ARCHIVED" ||
      normalizeInvitationEmail(invitation.professional.email ?? "") !==
        normalizeInvitationEmail(invitation.email)
    ) {
      return {
        error: "Este convite expirou, foi cancelado ou não está mais válido.",
      }
    }
    if (
      invitation.professional.userId &&
      invitation.professional.userId !== user.id
    ) {
      return { error: "Este profissional já está vinculado a outra conta." }
    }

    const membership = await tx.membership.findUnique({
      where: {
        userId_barbershopId: {
          userId: user.id,
          barbershopId: invitation.professional.barbershopId,
        },
      },
      select: { role: true },
    })
    if (membership && membership.role !== MembershipRole.PROFESSIONAL) {
      return { error: "Sua conta já possui outro papel nesta barbearia." }
    }

    const claimed = await tx.professionalInvitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash,
        acceptedAt: null,
        canceledAt: null,
        expiresAt: { gt: now },
      },
      data: { acceptedAt: now },
    })
    if (claimed.count !== 1) {
      return { error: "Este convite já foi usado ou deixou de ser válido." }
    }

    if (membership) {
      await tx.membership.update({
        where: {
          userId_barbershopId: {
            userId: user.id,
            barbershopId: invitation.professional.barbershopId,
          },
        },
        data: {
          status: MembershipStatus.ACTIVE,
          invitedAt: invitation.updatedAt,
          acceptedAt: now,
        },
      })
    } else {
      await tx.membership.create({
        data: {
          userId: user.id,
          barbershopId: invitation.professional.barbershopId,
          role: MembershipRole.PROFESSIONAL,
          status: MembershipStatus.ACTIVE,
          invitedAt: invitation.updatedAt,
          acceptedAt: now,
        },
      })
    }

    const linked = await tx.professional.updateMany({
      where: {
        id: invitation.professional.id,
        barbershopId: invitation.professional.barbershopId,
        OR: [{ userId: null }, { userId: user.id }],
      },
      data: { userId: user.id },
    })
    if (linked.count !== 1)
      throw new Error("INVITED_PROFESSIONAL_ALREADY_LINKED")

    return { slug: invitation.professional.barbershop.slug }
  })

  if ("error" in result) return { ok: false as const, error: result.error }
  return { ok: true as const, redirectTo: `/painel/${result.slug}` }
}
