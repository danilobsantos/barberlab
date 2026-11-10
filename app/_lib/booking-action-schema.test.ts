import assert from "node:assert/strict"
import test from "node:test"
import { createBookingSchema, serviceIdSchema } from "./booking-action-schema"

test("validates booking service IDs and dates at the action boundary", () => {
  assert.equal(serviceIdSchema.safeParse("service-1").success, true)
  assert.equal(serviceIdSchema.safeParse({}).success, false)
  assert.equal(
    createBookingSchema.safeParse({
      serviceId: "service-1",
      date: "not-a-date",
    }).success,
    false,
  )
  assert.equal(
    createBookingSchema.safeParse({ serviceId: "service-1", date: new Date() })
      .success,
    true,
  )
})
