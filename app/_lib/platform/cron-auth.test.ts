import assert from "node:assert/strict"
import test from "node:test"
import { isAuthorizedCronRequest } from "./cron-auth"

test("authorizes only the configured bearer secret", () => {
  assert.equal(isAuthorizedCronRequest("Bearer secret", "secret"), true)
  assert.equal(isAuthorizedCronRequest("Bearer wrong", "secret"), false)
  assert.equal(isAuthorizedCronRequest("secret", "secret"), false)
  assert.equal(isAuthorizedCronRequest("Bearer secret", ""), false)
})
