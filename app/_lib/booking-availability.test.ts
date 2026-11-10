import assert from "node:assert/strict"
import test from "node:test"
import {
  calculateAvailableSlots,
  effectiveScheduleException,
  intervalOverlaps,
  isOccupyingBookingStatus,
  localDayBounds,
  localDateTimeToInstant,
} from "./booking-availability"

test("only pending and confirmed bookings occupy a professional's calendar", () => {
  assert.equal(isOccupyingBookingStatus("PENDING"), true)
  assert.equal(isOccupyingBookingStatus("CONFIRMED"), true)
  for (const status of ["CANCELED", "COMPLETED", "NO_SHOW"]) {
    assert.equal(isOccupyingBookingStatus(status), false)
  }
})

test("intervals use half-open overlap boundaries", () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 9, minute))
  assert.equal(
    intervalOverlaps(
      { startsAt: at(0), endsAt: at(30) },
      { startsAt: at(30), endsAt: at(45) },
    ),
    false,
  )
  assert.equal(
    intervalOverlaps(
      { startsAt: at(0), endsAt: at(30) },
      { startsAt: at(29), endsAt: at(45) },
    ),
    true,
  )
})

test("UNAVAILABLE overrides CUSTOM_HOURS and CUSTOM_HOURS replaces weekly schedule", () => {
  const unavailable = {
    type: "UNAVAILABLE" as const,
    startsAt: null,
    endsAt: null,
  }
  const custom = {
    type: "CUSTOM_HOURS" as const,
    startsAt: "12:00",
    endsAt: "13:00",
  }
  assert.equal(effectiveScheduleException([custom, unavailable]), unavailable)
  const input = {
    date: "2026-01-05",
    timeZone: "America/Sao_Paulo",
    tenantHours: [{ startsAt: "09:00", endsAt: "17:00" }],
    professionalHours: [{ startsAt: "09:00", endsAt: "17:00" }],
    durationMinutes: 60,
    occupied: [],
  }
  assert.deepEqual(calculateAvailableSlots({ ...input, exception: custom }), [
    "12:00",
  ])
  assert.deepEqual(
    calculateAvailableSlots({ ...input, exception: unavailable }),
    [],
  )
})

test("IANA timezone conversion rejects DST gaps and picks the earlier repeated time", () => {
  assert.equal(
    localDateTimeToInstant("2026-03-08", "02:30", "America/New_York"),
    null,
  )
  assert.equal(
    localDateTimeToInstant(
      "2026-11-01",
      "01:30",
      "America/New_York",
    )?.toISOString(),
    "2026-11-01T05:30:00.000Z",
  )
  assert.equal(
    localDateTimeToInstant(
      "2026-01-05",
      "09:00",
      "America/Sao_Paulo",
    )?.toISOString(),
    "2026-01-05T12:00:00.000Z",
  )
})

test("local calendar days use timezone-aware 23- and 25-hour bounds", () => {
  const spring = localDayBounds("2026-03-08", "America/New_York")
  const fall = localDayBounds("2026-11-01", "America/New_York")
  assert.equal(
    (spring.endsAt.getTime() - spring.startsAt.getTime()) / 3_600_000,
    23,
  )
  assert.equal(
    (fall.endsAt.getTime() - fall.startsAt.getTime()) / 3_600_000,
    25,
  )
})
