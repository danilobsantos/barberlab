import assert from "node:assert/strict"
import test from "node:test"
import { hasTenantPermission } from "./permissions"

test("owners have all tenant permissions", () => {
  for (const permission of [
    "viewAdminPanel",
    "manageBookings",
    "manageSchedule",
    "manageServices",
    "manageTeam",
    "manageSettings",
  ] as const) {
    assert.equal(hasTenantPermission("OWNER", permission), true)
  }
})

test("managers can operate but cannot change tenant settings", () => {
  assert.equal(hasTenantPermission("MANAGER", "manageServices"), true)
  assert.equal(hasTenantPermission("MANAGER", "manageTeam"), true)
  assert.equal(hasTenantPermission("MANAGER", "manageBookings"), true)
  assert.equal(hasTenantPermission("MANAGER", "manageSettings"), false)
})

test("professionals cannot access tenant-wide admin data before scoping exists", () => {
  assert.equal(hasTenantPermission("PROFESSIONAL", "viewAdminPanel"), false)
  assert.equal(hasTenantPermission("PROFESSIONAL", "manageBookings"), false)
})
