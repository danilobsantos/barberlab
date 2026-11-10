import assert from "node:assert/strict"
import test from "node:test"
import { professionalSchema } from "../(admin)/_lib/professional-schema"

test("professional input accepts optional empty fields and unique service ids", () => {
  const parsed = professionalSchema.safeParse({
    name: "  Ana Silva ",
    displayName: "",
    email: "ana@example.com",
    phone: "",
    bio: "",
    serviceIds: ["550e8400-e29b-41d4-a716-446655440000"],
  })

  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.name, "Ana Silva")
    assert.equal(parsed.data.displayName, null)
    assert.equal(parsed.data.phone, null)
  }
})

test("professional input rejects invalid email and duplicate services", () => {
  const base = {
    name: "Ana Silva",
    displayName: null,
    email: "invalid",
    phone: null,
    bio: null,
    serviceIds: [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440000",
    ],
  }

  assert.equal(professionalSchema.safeParse(base).success, false)
})
