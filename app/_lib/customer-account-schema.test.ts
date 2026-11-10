import assert from "node:assert/strict"
import test from "node:test"
import { customerAccountSchema } from "./customer-account-schema"

test("validates tenant customer account fields at the action boundary", () => {
  assert.equal(
    customerAccountSchema.safeParse({
      slug: "barbearia-central",
      name: "  Ana  ",
      phone: "  11999999999  ",
      email: "ana@example.com",
      notes: "  Preferência  ",
    }).success,
    true,
  )
  assert.equal(
    customerAccountSchema.safeParse({
      slug: "Barbearia Central",
      name: "",
      phone: "",
      email: "invalido",
      notes: "x".repeat(1001),
    }).success,
    false,
  )
})
