import assert from "node:assert/strict"
import test from "node:test"
import { BookingStatus } from "@prisma/client"
import { previousBookingStatuses } from "./booking-status-transitions"

test("booking status transitions follow the documented lifecycle", () => {
  assert.deepEqual(previousBookingStatuses(BookingStatus.CONFIRMED), [
    BookingStatus.PENDING,
  ])
  assert.deepEqual(previousBookingStatuses(BookingStatus.COMPLETED), [
    BookingStatus.CONFIRMED,
  ])
  assert.deepEqual(previousBookingStatuses(BookingStatus.NO_SHOW), [
    BookingStatus.CONFIRMED,
  ])
  assert.deepEqual(previousBookingStatuses(BookingStatus.CANCELED), [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
  ])
  assert.deepEqual(previousBookingStatuses(BookingStatus.PENDING), [])
})
