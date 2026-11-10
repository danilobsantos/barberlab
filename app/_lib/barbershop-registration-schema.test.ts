import assert from "node:assert/strict"
import test from "node:test"
import { barbershopRegistrationSchema } from "./barbershop-registration-schema"

const valid = {
  name: "Barber Lab",
  slug: "barber-lab",
  address: "Rua Central, 123",
  phone: "(11) 99999-1234",
}

test("rejects reserved and non-kebab-case slugs", () => {
  for (const slug of [
    "painel",
    "api",
    "login",
    "cadastro",
    "precos",
    "barbershops",
    "bookings",
    "dashboard",
    "schedule",
    "services",
    "settings",
    "carreiras",
    "contato",
    "cookies",
    "parceiros",
    "perfil",
    "privacidade",
    "sobre",
    "termos",
    "foo_bar",
    "foo--bar",
    "-foo",
    "foo-",
  ]) {
    assert.equal(
      barbershopRegistrationSchema.safeParse({ ...valid, slug }).success,
      false,
      slug,
    )
  }
})

test("normalizes slug and phone", () => {
  const result = barbershopRegistrationSchema.parse({
    ...valid,
    slug: "  BARBER-LAB  ",
    phone: " (11) 99999-1234 ",
  })
  assert.equal(result.slug, "barber-lab")
  assert.equal(result.phone, "11999991234")
})
