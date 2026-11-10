import assert from "node:assert/strict"
import test from "node:test"
import {
  createBookingSchema,
  publicBookingTenantFilter,
  serviceIdSchema,
  serviceInputSchema,
  unavailableIntervalsSchema,
} from "./booking-action-schema"

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
  assert.equal(
    createBookingSchema.safeParse({ ...validBooking, slug: "barber-lab" })
      .success,
    true,
  )
  assert.equal(
    createBookingSchema.safeParse({ ...validBooking, slug: "Other Tenant" })
      .success,
    false,
  )
  assert.equal(
    unavailableIntervalsSchema.safeParse({
      serviceId: "service-1",
      professionalId: "professional-1",
      date: "2026-01-05",
      slug: "barber-lab",
    }).success,
    true,
  )
  assert.equal(serviceInputSchema.safeParse("service-1").success, true)
  assert.equal(
    serviceInputSchema.safeParse({ serviceId: "service-1", slug: "barber-lab" })
      .success,
    true,
  )
})

test("booking actions require a tenant slug outside single-tenant mode", () => {
  assert.deepEqual(publicBookingTenantFilter("shop-a", null), {
    slug: "shop-a",
  })
  assert.deepEqual(publicBookingTenantFilter("shop-a", "shop-id"), {
    id: "shop-id",
    slug: "shop-a",
  })
  assert.deepEqual(publicBookingTenantFilter(undefined, "shop-id"), {
    id: "shop-id",
  })
  assert.equal(publicBookingTenantFilter(undefined, null), null)
})
