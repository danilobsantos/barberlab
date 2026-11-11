"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { BookingStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { previousBookingStatuses } from "@/app/_lib/booking-status-transitions"
import { withTenantContext } from "@/app/_lib/database-context"

const schema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(BookingStatus),
})

export const updateBookingStatus = async (input: unknown, slug: string) => {
  const admin = await requireAdminContext(slug, "manageBookings")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "Dados inválidos." }
  }
  const previousStatuses = previousBookingStatuses(parsed.data.status)
  if (!previousStatuses.length) {
    return { ok: false as const, error: "Transição de status inválida." }
  }

  const result = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.booking.updateMany({
        where: {
          id: parsed.data.bookingId,
          status: { in: [...previousStatuses] },
          service: { barbershopId: admin.barbershopId },
          ...(admin.professionalId
            ? { professionalId: admin.professionalId }
            : {}),
        },
        data: { status: parsed.data.status },
      }),
    admin.userId,
  )

  if (result.count === 0) {
    return { ok: false as const, error: "Agendamento não encontrado." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/schedule")
  revalidatePath("/bookings")
  if (slug) {
    revalidatePath(`/painel/${slug}/dashboard`)
    revalidatePath(`/painel/${slug}/schedule`)
  }

  return { ok: true as const }
}
