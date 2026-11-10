"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { db } from "@/app/_lib/prisma"
import { BookingStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"

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

  const result = await db.booking.updateMany({
    where: {
      id: parsed.data.bookingId,
      service: { barbershopId: admin.barbershopId },
      ...(admin.professionalId ? { professionalId: admin.professionalId } : {}),
    },
    data: { status: parsed.data.status },
  })

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
