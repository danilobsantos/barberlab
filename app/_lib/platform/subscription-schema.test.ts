import assert from "node:assert/strict"
import test from "node:test"
import { subscriptionSchema } from "./subscription-schema"

const input = {
  barbershopId: "00000000-0000-4000-8000-000000000001",
  planId: "00000000-0000-4000-8000-000000000002",
  status: "TRIALING",
  currentPeriodStart: "2026-11-10",
  currentPeriodEnd: "2026-12-10",
}

test("accepts valid subscription periods", () => {
  assert.equal(subscriptionSchema.safeParse(input).success, true)
})

test("rejects invalid status and non-increasing periods", () => {
  assert.equal(
    subscriptionSchema.safeParse({ ...input, status: "UNKNOWN" }).success,
    false,
  )
  assert.equal(
    subscriptionSchema.safeParse({
      ...input,
      currentPeriodEnd: input.currentPeriodStart,
    }).success,
    false,
  )
})
