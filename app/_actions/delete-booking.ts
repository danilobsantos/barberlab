"use server"

import { revalidatePath } from "next/cache"
import { auth } from "../_lib/auth"
import { consumeRateLimit, rateLimitError } from "../_lib/rate-limit"
import { BookingStatus } from "@prisma/client"
import { withDatabaseContext } from "@/app/_lib/database-context"

export const deleteBooking = async (bookingId: string) => {
  const session = await auth()

  if (!session?.user?.id || session.user.accountType !== "CUSTOMER") {
    return { ok: false as const, error: "Você precisa estar logado." }
  }

  const limit = await consumeRateLimit("deleteBooking", session.user.id)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  if (typeof bookingId !== "string" || bookingId.length === 0) {
    return { ok: false as const, error: "Reserva inválida." }
  }

  const canceled = await withDatabaseContext(
    { userId: session.user.id },
    (tx) =>
      tx.booking.updateMany({
        where: {
          id: bookingId,
          userId: session.user.id,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
        data: { status: BookingStatus.CANCELED },
      }),
  )
  if (canceled.count === 0) {
    return { ok: false as const, error: "Reserva não encontrada." }
  }

  revalidatePath("/bookings", "page")
  revalidatePath("/", "page")
  revalidatePath("/dashboard")
  revalidatePath("/schedule")

  return { ok: true as const }
}
