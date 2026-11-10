import type { BookingStatus } from "@prisma/client"

export const canCancelBooking = (
  status: BookingStatus,
  date: Date,
  now = new Date(),
) => (status === "PENDING" || status === "CONFIRMED") && date > now
