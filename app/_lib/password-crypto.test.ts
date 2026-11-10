import assert from "node:assert/strict"
import test from "node:test"
import {
  hashPassword,
  hashPasswordResetToken,
  verifyPassword,
} from "./password-crypto"
import {
  passwordCredentialsSchema,
  passwordRegistrationSchema,
  passwordResetSchema,
} from "./password-auth-schema"

test("stores password hashes and verifies only the matching password", async () => {
  const encoded = await hashPassword("correct horse battery staple")
  assert.notEqual(encoded, "correct horse battery staple")
  assert.equal(
    await verifyPassword("correct horse battery staple", encoded),
    true,
  )
  assert.equal(await verifyPassword("wrong password", encoded), false)
  assert.equal(await verifyPassword("x", "invalid"), false)
})

test("normalizes email, limits password length, and matches reset confirmation", () => {
  const registration = passwordRegistrationSchema.parse({
    email: " OWNER@Example.COM ",
    password: "correct horse battery staple",
    accountType: "BARBERSHOP",
  })
  assert.equal(registration.email, "owner@example.com")
  assert.equal(
    passwordCredentialsSchema.safeParse({
      email: "owner@example.com",
      password: "short",
      accountType: "BARBERSHOP",
    }).success,
    false,
  )
  assert.equal(
    passwordResetSchema.safeParse({
      email: "owner@example.com",
      token: "t".repeat(32),
      password: "correct horse battery staple",
      passwordConfirmation: "another password",
    }).success,
    false,
  )
})

test("hashes reset tokens before persistence", () => {
  assert.equal(hashPasswordResetToken("token").length, 64)
  assert.notEqual(hashPasswordResetToken("token"), "token")
})
