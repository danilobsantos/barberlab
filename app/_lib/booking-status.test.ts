import assert from "node:assert/strict"
import test from "node:test"
import { canCancelBooking } from "./booking-status"

const now = new Date("2026-06-01T12:00:00.000Z")
const future = new Date("2026-06-02T12:00:00.000Z")

test("only future pending or confirmed bookings can be canceled", () => {
  assert.equal(canCancelBooking("PENDING", future, now), true)
  assert.equal(canCancelBooking("CONFIRMED", future, now), true)
  assert.equal(canCancelBooking("CANCELED", future, now), false)
  assert.equal(canCancelBooking("COMPLETED", future, now), false)
  assert.equal(canCancelBooking("NO_SHOW", future, now), false)
  assert.equal(canCancelBooking("CONFIRMED", now, now), false)
})
