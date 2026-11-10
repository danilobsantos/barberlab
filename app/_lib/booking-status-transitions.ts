import { BookingStatus } from "@prisma/client"

const PREVIOUS_STATUSES: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: [],
  CONFIRMED: [BookingStatus.PENDING],
  COMPLETED: [BookingStatus.CONFIRMED],
  NO_SHOW: [BookingStatus.CONFIRMED],
  CANCELED: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
}

export const previousBookingStatuses = (status: BookingStatus) =>
  PREVIOUS_STATUSES[status]
