import assert from "node:assert/strict"
import test from "node:test"
import {
  canUseFeature,
  isWithinProfessionalLimit,
  type TenantEntitlements,
} from "./entitlements"

const entitlements: TenantEntitlements = {
  planId: "plan-1",
  maxProfessionals: 2,
  activeProfessionals: 1,
  features: { reports_basic: true },
}

test("checks plan features without depending on the UI", () => {
  assert.equal(canUseFeature(entitlements, "reports_basic"), true)
  assert.equal(canUseFeature(entitlements, "reports_advanced"), false)
})

test("checks professional capacity including requested additions", () => {
  assert.equal(isWithinProfessionalLimit(entitlements), true)
  assert.equal(isWithinProfessionalLimit(entitlements, 2), false)
  assert.equal(
    isWithinProfessionalLimit({ ...entitlements, maxProfessionals: null }),
    true,
  )
  assert.equal(
    isWithinProfessionalLimit({
      ...entitlements,
      planId: null,
      maxProfessionals: 0,
    }),
    false,
  )
})
