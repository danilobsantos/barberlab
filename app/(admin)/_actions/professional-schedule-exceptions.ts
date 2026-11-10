"use server"

import { db } from "@/app/_lib/prisma"
import { professionalScheduleExceptionSchema } from "@/app/_lib/professional-schedule-exception-schema"
import { MAX_PROFESSIONAL_SCHEDULE_EXCEPTIONS } from "@/app/_lib/professional-schedule-exception-limit"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { revalidatePath } from "next/cache"

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)

export const saveProfessionalScheduleException = async (
  professionalId: string,
  input: unknown,
  slug: string,
) => {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  if (!isUuid(professionalId)) {
    return { ok: false as const, error: "Profissional não encontrado." }
  }

  const parsed = professionalScheduleExceptionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const result = await db.$transaction(async (tx) => {
    const professional = await tx.professional.findFirst({
      where: { id: professionalId, barbershopId: admin.barbershopId },
      select: { id: true },
    })
    if (!professional) return "missing" as const

    const date = new Date(`${parsed.data.date}T00:00:00.000Z`)
    const where = {
      barbershopId: admin.barbershopId,
      professionalId,
      date,
      type: parsed.data.type,
    }
    const [matching, count] = await Promise.all([
      tx.professionalScheduleException.findMany({
        where,
        select: { id: true },
      }),
      tx.professionalScheduleException.count({
        where: { barbershopId: admin.barbershopId, professionalId },
      }),
    ])
    if (count - matching.length + 1 > MAX_PROFESSIONAL_SCHEDULE_EXCEPTIONS) {
      return "limit" as const
    }

    await tx.professionalScheduleException.deleteMany({ where })
    await tx.professionalScheduleException.create({
      data: {
        ...parsed.data,
        date,
        professionalId,
        barbershopId: admin.barbershopId,
        startsAtLocal:
          parsed.data.type === "CUSTOM_HOURS"
            ? parsed.data.startsAtLocal
            : null,
        endsAtLocal:
          parsed.data.type === "CUSTOM_HOURS" ? parsed.data.endsAtLocal : null,
      },
    })
    return "saved" as const
  })

  if (result === "missing") {
    return { ok: false as const, error: "Profissional não encontrado." }
  }
  if (result === "limit") {
    return {
      ok: false as const,
      error: `O limite é de ${MAX_PROFESSIONAL_SCHEDULE_EXCEPTIONS} exceções por profissional.`,
    }
  }

  revalidatePath(`/painel/${slug}/team`)
  return { ok: true as const }
}

export const deleteProfessionalScheduleException = async (
  professionalId: string,
  exceptionId: string,
  slug: string,
) => {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  if (!isUuid(professionalId) || !isUuid(exceptionId)) {
    return { ok: false as const, error: "Exceção não encontrada." }
  }

  const deleted = await db.professionalScheduleException.deleteMany({
    where: {
      id: exceptionId,
      professionalId,
      barbershopId: admin.barbershopId,
    },
  })
  if (!deleted.count) {
    return { ok: false as const, error: "Exceção não encontrada." }
  }

  revalidatePath(`/painel/${slug}/team`)
  return { ok: true as const }
}
