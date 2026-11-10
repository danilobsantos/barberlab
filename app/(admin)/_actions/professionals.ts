"use server"

import { db } from "@/app/_lib/prisma"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { ProfessionalStatus } from "@prisma/client"
import {
  isWithinProfessionalLimit,
  lockAndGetTenantEntitlements,
} from "@/app/_lib/platform/entitlements"
import { revalidatePath } from "next/cache"
import { professionalSchema } from "../_lib/professional-schema"

const revalidateTeam = (slug: string) => {
  revalidatePath(`/painel/${slug}/team`)
  revalidatePath(`/painel/${slug}/schedule`)
}

export const upsertProfessional = async (input: unknown, slug: string) => {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsed = professionalSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { id, serviceIds, ...data } = parsed.data
  const services = await db.barbershopService.findMany({
    where: { id: { in: serviceIds }, barbershopId: admin.barbershopId },
    select: { id: true },
  })
  if (services.length !== serviceIds.length) {
    return {
      ok: false as const,
      error: "Selecione apenas serviços desta barbearia.",
    }
  }

  const result = await db.$transaction(async (tx) => {
    const entitlements = await lockAndGetTenantEntitlements(
      tx,
      admin.barbershopId,
    )
    let professionalId = id

    if (id) {
      const current = await tx.professional.findFirst({
        where: { id, barbershopId: admin.barbershopId },
        select: { id: true },
      })
      if (!current) return "missing" as const

      const removed = await tx.professionalService.findMany({
        where: {
          professionalId: id,
          barbershopId: admin.barbershopId,
          serviceId: { notIn: serviceIds },
          bookings: { some: {} },
        },
        select: { serviceId: true },
      })
      if (removed.length) return "booked" as const

      await tx.professional.updateMany({
        where: { id, barbershopId: admin.barbershopId },
        data,
      })
      await tx.professionalService.deleteMany({
        where: {
          professionalId: id,
          barbershopId: admin.barbershopId,
          serviceId: { notIn: serviceIds },
        },
      })
    } else {
      if (!isWithinProfessionalLimit(entitlements)) return "limit" as const
      const professional = await tx.professional.create({
        data: { ...data, barbershopId: admin.barbershopId },
        select: { id: true },
      })
      professionalId = professional.id
    }

    if (serviceIds.length) {
      await tx.professionalService.createMany({
        data: serviceIds.map((serviceId) => ({
          barbershopId: admin.barbershopId,
          professionalId: professionalId!,
          serviceId,
        })),
        skipDuplicates: true,
      })
    }
    return "saved" as const
  })

  if (result === "missing") {
    return { ok: false as const, error: "Profissional não encontrado." }
  }
  if (result === "booked") {
    return {
      ok: false as const,
      error:
        "Não é possível remover um serviço com agendamentos deste profissional.",
    }
  }
  if (result === "limit") {
    return {
      ok: false as const,
      error: "O plano atual atingiu o limite de profissionais ativos.",
    }
  }

  revalidateTeam(slug)
  return { ok: true as const }
}

export const setProfessionalActive = async (
  professionalId: string,
  isActive: boolean,
  slug: string,
) => {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)
  if (
    !/^[0-9a-f-]{36}$/i.test(professionalId) ||
    typeof isActive !== "boolean"
  ) {
    return { ok: false as const, error: "Dados inválidos." }
  }

  const result = await db.$transaction(async (tx) => {
    const entitlements = await lockAndGetTenantEntitlements(
      tx,
      admin.barbershopId,
    )
    const current = await tx.professional.findFirst({
      where: { id: professionalId, barbershopId: admin.barbershopId },
      select: { status: true },
    })
    if (!current) return "missing" as const
    if (
      isActive &&
      current.status !== ProfessionalStatus.ACTIVE &&
      !isWithinProfessionalLimit(entitlements)
    ) {
      return "limit" as const
    }

    await tx.professional.updateMany({
      where: { id: professionalId, barbershopId: admin.barbershopId },
      data: {
        status: isActive
          ? ProfessionalStatus.ACTIVE
          : ProfessionalStatus.INACTIVE,
      },
    })
    return "updated" as const
  })
  if (result === "missing") {
    return { ok: false as const, error: "Profissional não encontrado." }
  }
  if (result === "limit") {
    return {
      ok: false as const,
      error: "O plano atual atingiu o limite de profissionais ativos.",
    }
  }

  revalidateTeam(slug)
  return { ok: true as const }
}
