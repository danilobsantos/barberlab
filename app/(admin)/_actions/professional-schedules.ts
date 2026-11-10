"use server"

import { db } from "@/app/_lib/prisma"
import { professionalScheduleSchema } from "@/app/_lib/professional-schedule-schema"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { revalidatePath } from "next/cache"

export const saveProfessionalSchedule = async (
  professionalId: string,
  input: unknown,
  slug: string,
) => {
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  if (
    typeof professionalId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(professionalId)
  ) {
    return { ok: false as const, error: "Profissional não encontrado." }
  }

  const parsed = professionalScheduleSchema.safeParse(input)
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
    if (!professional) return false

    await tx.professionalSchedule.deleteMany({
      where: { professionalId, barbershopId: admin.barbershopId },
    })
    if (parsed.data.length) {
      await tx.professionalSchedule.createMany({
        data: parsed.data.map((interval) => ({
          ...interval,
          professionalId,
          barbershopId: admin.barbershopId,
        })),
      })
    }
    return true
  })

  if (!result) {
    return { ok: false as const, error: "Profissional não encontrado." }
  }

  revalidatePath(`/painel/${slug}/team`)
  return { ok: true as const }
}
