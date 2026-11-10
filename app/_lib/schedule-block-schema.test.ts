import assert from "node:assert/strict"
import test from "node:test"
import { scheduleBlockSchema } from "./schedule-block-schema"

const valid = {
  date: "2026-11-09",
  startTime: "12:00",
  endTime: "13:00",
}

test("schedule block accepts general and professional-specific scope", () => {
  assert.equal(scheduleBlockSchema.safeParse(valid).success, true)
  assert.equal(
    scheduleBlockSchema.safeParse({
      ...valid,
      professionalId: "550e8400-e29b-41d4-a716-446655440000",
    }).success,
    true,
  )
})

test("schedule block rejects invalid professional IDs and time ranges", () => {
  assert.equal(
    scheduleBlockSchema.safeParse({ ...valid, professionalId: "other" })
      .success,
    false,
  )
  assert.equal(
    scheduleBlockSchema.safeParse({ ...valid, endTime: "12:00" }).success,
    false,
  )
})

test("schedule block rejects impossible dates and times", () => {
  for (const date of ["2026-02-30", "2026-13-01", "2026-00-10"]) {
    assert.equal(
      scheduleBlockSchema.safeParse({ ...valid, date }).success,
      false,
    )
  }
  for (const time of ["99:99", "24:00", "12:60"]) {
    assert.equal(
      scheduleBlockSchema.safeParse({ ...valid, startTime: time }).success,
      false,
    )
  }
})
