import assert from "node:assert/strict"
import test from "node:test"
import { planSchema } from "./plan-schema"

const plan = {
  name: "Starter",
  slug: "starter",
  description: "Plano básico",
  priceMonthly: "49.90",
  maxProfessionals: "2",
  features: "reports_basic, professional_schedule",
}

test("plan schema parses price, professional limit and feature flags", () => {
  assert.deepEqual(planSchema.parse(plan), {
    ...plan,
    maxProfessionals: 2,
    features: { reports_basic: true, professional_schedule: true },
  })
})

test("plan schema accepts an unlimited professional limit", () => {
  assert.equal(
    planSchema.parse({ ...plan, maxProfessionals: "" }).maxProfessionals,
    null,
  )
})

test("plan schema rejects malformed prices and feature names", () => {
  assert.equal(
    planSchema.safeParse({ ...plan, priceMonthly: "-1" }).success,
    false,
  )
  assert.equal(
    planSchema.safeParse({ ...plan, features: "reports basic" }).success,
    false,
  )
})
