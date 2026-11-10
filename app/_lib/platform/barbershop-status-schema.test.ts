import assert from "node:assert/strict"
import test from "node:test"
import { platformBarbershopStatusSchema } from "./barbershop-status-schema"

test("allows only platform activation and suspension actions", () => {
  const barbershopId = "550e8400-e29b-41d4-a716-446655440000"
  assert.equal(
    platformBarbershopStatusSchema.safeParse({ barbershopId, status: "ACTIVE" })
      .success,
    true,
  )
  assert.equal(
    platformBarbershopStatusSchema.safeParse({
      barbershopId,
      status: "ARCHIVED",
    }).success,
    false,
  )
})
