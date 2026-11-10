import assert from "node:assert/strict"
import test from "node:test"
import { professionalScheduleSchema } from "./professional-schedule-schema"
import { MAX_PROFESSIONAL_SCHEDULE_INTERVALS } from "./professional-schedule-limit"

test("validates weekly intervals and allows separate intervals", () => {
  assert.equal(
    professionalScheduleSchema.safeParse([
      { weekday: 1, startsAtLocal: "09:00", endsAtLocal: "12:00" },
      { weekday: 1, startsAtLocal: "13:00", endsAtLocal: "18:00" },
      { weekday: 7, startsAtLocal: "19:00", endsAtLocal: "20:00" },
    ]).success,
    false,
  )
  assert.equal(
    professionalScheduleSchema.safeParse([
      { weekday: 1, startsAtLocal: "09:00", endsAtLocal: "12:00" },
      { weekday: 1, startsAtLocal: "12:00", endsAtLocal: "18:00" },
    ]).success,
    true,
  )
})

test("rejects invalid times, reversed intervals, and overlapping intervals", () => {
  for (const intervals of [
    [{ weekday: -1, startsAtLocal: "09:00", endsAtLocal: "10:00" }],
    [{ weekday: 0, startsAtLocal: "24:00", endsAtLocal: "25:00" }],
    [{ weekday: 0, startsAtLocal: "11:00", endsAtLocal: "10:00" }],
    [
      { weekday: 2, startsAtLocal: "09:00", endsAtLocal: "12:00" },
      { weekday: 2, startsAtLocal: "11:30", endsAtLocal: "14:00" },
    ],
  ]) {
    assert.equal(professionalScheduleSchema.safeParse(intervals).success, false)
  }
})

test("rejects more than the weekly interval limit before overlap checks", () => {
  const result = professionalScheduleSchema.safeParse(
    Array.from(
      { length: MAX_PROFESSIONAL_SCHEDULE_INTERVALS + 1 },
      (_, index) => ({
        weekday: index % 7,
        startsAtLocal: "09:00",
        endsAtLocal: "10:00",
      }),
    ),
  )

  assert.equal(result.success, false)
  if (!result.success) {
    assert.ok(
      result.error.issues.some((issue) =>
        issue.message.includes(`${MAX_PROFESSIONAL_SCHEDULE_INTERVALS}`),
      ),
    )
  }
})
