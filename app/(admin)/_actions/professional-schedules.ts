"use server"

import { db } from "@/app/_lib/prisma"
import { professionalScheduleSchema } from "@/app/_lib/professional-schedule-schema"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import {
  canUseFeature,
  lockAndGetTenantEntitlements,
} from "@/app/_lib/platform/entitlements"
import { revalidatePath } from "next/cache"
import { withTenantContext } from "@/app/_lib/database-context"

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

  const result = await withTenantContext(
    admin.barbershopId,
    () =>
      db.$transaction(async (tx) => {
        const entitlements = await lockAndGetTenantEntitlements(
          tx,
          admin.barbershopId,
        )
        if (!canUseFeature(entitlements, "professional_schedule")) {
          return "feature" as const
        }

        const professional = await tx.professional.findFirst({
          where: { id: professionalId, barbershopId: admin.barbershopId },
          select: { id: true },
        })
        if (!professional) return "missing" as const

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
        return "saved" as const
      }),
    admin.userId,
  )

  if (result === "missing") {
    return { ok: false as const, error: "Profissional não encontrado." }
  }
  if (result === "feature") {
    return {
      ok: false as const,
      error: "O plano atual não inclui jornadas profissionais.",
    }
  }

  revalidatePath(`/painel/${slug}/team`)
  return { ok: true as const }
}
