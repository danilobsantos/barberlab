"use server"

import { revalidatePath } from "next/cache"
import { auth } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { consumeRateLimit, rateLimitError } from "../_lib/rate-limit"

export const deleteBooking = async (bookingId: string) => {
  const session = await auth()

  if (!session?.user) {
    return { ok: false as const, error: "Você precisa estar logado." }
  }

  const limit = await consumeRateLimit("deleteBooking", session.user.id)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  if (typeof bookingId !== "string" || bookingId.length === 0) {
    return { ok: false as const, error: "Reserva inválida." }
  }

  const deleted = await db.booking.deleteMany({
    where: { id: bookingId, userId: session.user.id },
  })
  if (deleted.count === 0) {
    return { ok: false as const, error: "Reserva não encontrada." }
  }

  revalidatePath("/bookings", "page")
  revalidatePath("/", "page")
  revalidatePath("/dashboard")
  revalidatePath("/schedule")

  return { ok: true as const }
}
