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

test("professionals can access their agenda but not tenant-wide management", () => {
  assert.equal(hasTenantPermission("PROFESSIONAL", "viewAdminPanel"), true)
  assert.equal(hasTenantPermission("PROFESSIONAL", "manageBookings"), true)
  assert.equal(hasTenantPermission("PROFESSIONAL", "manageSchedule"), false)
  assert.equal(hasTenantPermission("PROFESSIONAL", "manageServices"), false)
  assert.equal(hasTenantPermission("PROFESSIONAL", "manageTeam"), false)
  assert.equal(hasTenantPermission("PROFESSIONAL", "manageSettings"), false)
})
