import assert from "node:assert/strict"
import test from "node:test"
import { createBookingSchema, serviceIdSchema } from "./booking-action-schema"

test("validates booking service IDs and dates at the action boundary", () => {
  assert.equal(serviceIdSchema.safeParse("service-1").success, true)
  assert.equal(serviceIdSchema.safeParse({}).success, false)
  const validBooking = {
    serviceId: "service-1",
    professionalId: "professional-1",
    date: "2026-01-05",
    time: "09:00",
  }
  assert.equal(
    createBookingSchema.safeParse({ ...validBooking, date: "not-a-date" })
      .success,
    false,
  )
  assert.equal(createBookingSchema.safeParse(validBooking).success, true)
})
