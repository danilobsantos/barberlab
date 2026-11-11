"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { BookingStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { scheduleBlockSchema } from "@/app/_lib/schedule-block-schema"
import { withTenantContext } from "@/app/_lib/database-context"

const buildDate = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

export const createScheduleBlock = async (input: unknown, slug: string) => {
  const admin = await requireAdminContext(slug, "manageSchedule")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = scheduleBlockSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { date, startTime, endTime, reason, professionalId } = parsed.data
  if (
    professionalId &&
    !(await withTenantContext(
      admin.barbershopId,
      (tx) =>
        tx.professional.findFirst({
          where: { id: professionalId, barbershopId: admin.barbershopId },
          select: { id: true },
        }),
      admin.userId,
    ))
  ) {
    return { ok: false as const, error: "Profissional não encontrado." }
  }
  const startsAt = buildDate(date, startTime)
  const endsAt = buildDate(date, endTime)

  const bookings = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.booking.findMany({
        where: {
          status: { not: BookingStatus.CANCELED },
          date: {
            gte: new Date(startsAt.getTime() - 480 * 60 * 1000),
            lt: endsAt,
          },
          service: { barbershopId: admin.barbershopId },
          ...(professionalId ? { professionalId } : {}),
        },
        select: {
          date: true,
          professionalId: true,
          service: { select: { durationMinutes: true } },
        },
      }),
    admin.userId,
  )
  const conflicting = bookings.filter(
    (booking) =>
      booking.date < endsAt &&
      booking.date.getTime() + booking.service.durationMinutes * 60 * 1000 >
        startsAt.getTime(),
  ).length

  if (conflicting > 0) {
    return {
      ok: false as const,
      error: `Existe ${conflicting} agendamento(s) nesse intervalo. Cancele ou reagende antes de bloquear.`,
    }
  }

  await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.scheduleBlock.create({
        data: {
          barbershopId: admin.barbershopId,
          startsAt,
          endsAt,
          reason: reason || null,
          professionalId: professionalId || null,
        },
      }),
    admin.userId,
  )

  revalidatePath("/schedule")
  revalidatePath("/dashboard")
  if (slug) {
    revalidatePath(`/painel/${slug}/schedule`)
    revalidatePath(`/painel/${slug}/dashboard`)
  }

  return { ok: true as const }
}

export const deleteScheduleBlock = async (blockId: string, slug: string) => {
  const admin = await requireAdminContext(slug, "manageSchedule")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const result = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.scheduleBlock.deleteMany({
        where: { id: blockId, barbershopId: admin.barbershopId },
      }),
    admin.userId,
  )

  if (result.count === 0) {
    return { ok: false as const, error: "Bloqueio não encontrado." }
  }

  revalidatePath("/schedule")
  revalidatePath("/dashboard")
  if (slug) {
    revalidatePath(`/painel/${slug}/schedule`)
    revalidatePath(`/painel/${slug}/dashboard`)
  }

  return { ok: true as const }
}
