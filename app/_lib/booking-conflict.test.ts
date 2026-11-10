import assert from "node:assert/strict"
import test from "node:test"
import { isBookingConflictError } from "./booking-conflict"

test("recognizes PostgreSQL overlap, deadlock and Prisma transaction conflicts", () => {
  assert.equal(
    isBookingConflictError({
      meta: { constraint: "Booking_professional_no_overlap" },
    }),
    true,
  )
  assert.equal(isBookingConflictError(new Error("SQLSTATE 23P01")), true)
  assert.equal(isBookingConflictError(new Error("SQLSTATE 40P01")), true)
  assert.equal(isBookingConflictError({ code: "P2034" }), true)
  assert.equal(isBookingConflictError(new Error("connection timeout")), false)
})
