import assert from "node:assert/strict"
import test from "node:test"
import { professionalScheduleExceptionSchema } from "./professional-schedule-exception-schema"

test("accepts unavailable dates and custom hours, including historical corrections", () => {
  assert.equal(
    professionalScheduleExceptionSchema.safeParse({
      date: "2020-02-29",
      type: "UNAVAILABLE",
      reason: "Folga",
    }).success,
    true,
  )
  assert.equal(
    professionalScheduleExceptionSchema.safeParse({
      date: "2026-11-09",
      type: "CUSTOM_HOURS",
      startsAtLocal: "10:00",
      endsAtLocal: "14:00",
    }).success,
    true,
  )
})

test("rejects invalid dates, times, reversed hours, and oversized reasons", () => {
  for (const exception of [
    { date: "2025-02-29", type: "UNAVAILABLE" },
    { date: "not-a-date", type: "UNAVAILABLE" },
    {
      date: "2026-11-09",
      type: "CUSTOM_HOURS",
      startsAtLocal: "14:00",
      endsAtLocal: "14:00",
    },
    {
      date: "2026-11-09",
      type: "CUSTOM_HOURS",
      startsAtLocal: "24:00",
      endsAtLocal: "25:00",
    },
    { date: "2026-11-09", type: "UNAVAILABLE", reason: "x".repeat(201) },
  ]) {
    assert.equal(
      professionalScheduleExceptionSchema.safeParse(exception).success,
      false,
    )
  }
})
