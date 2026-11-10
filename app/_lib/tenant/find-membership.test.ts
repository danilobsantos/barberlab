import assert from "node:assert/strict"
import test from "node:test"
import type { Prisma } from "@prisma/client"
import { findMembershipForTenant } from "./find-membership"

const store = (
  members: Record<string, string[]>,
  inactiveTenants: string[] = [],
) => {
  const tenantIds: Record<string, string> = {
    "shop-a": "tenant-a",
    "shop-b": "tenant-b",
  }
  return {
    barbershop: {
      findFirst: async ({ where }: { where: { slug: string } }) => {
        const id = tenantIds[where.slug]
        if (!id || inactiveTenants.includes(where.slug)) return null
        return { id, slug: where.slug, timezone: "America/Sao_Paulo" }
      },
    },
    membership: {
      findFirst: async ({
        where,
      }: {
        where: { userId: string; barbershopId: string }
      }) => {
        const slug = Object.keys(tenantIds).find(
          (key) => tenantIds[key] === where.barbershopId,
        )
        return slug && members[slug]?.includes(where.userId)
          ? { role: "OWNER" as const }
          : null
      },
    },
  } as unknown as Prisma.TransactionClient
}

test("authorizes only an active member of the tenant identified by slug", async () => {
  const db = store({ "shop-a": ["user-a"], "shop-b": ["user-b"] })

  assert.equal(
    (await findMembershipForTenant(db, "user-a", "shop-a"))?.barbershopId,
    "tenant-a",
  )
  assert.equal(await findMembershipForTenant(db, "user-a", "shop-b"), null)
  assert.equal(
    await findMembershipForTenant(db, "unknown-user", "shop-a"),
    null,
  )
  assert.equal(await findMembershipForTenant(db, "user-a", "bad_slug"), null)
})

test("does not resolve an unavailable tenant", async () => {
  assert.equal(
    await findMembershipForTenant(
      store({ "shop-a": ["user-a"] }, ["shop-a"]),
      "user-a",
      "shop-a",
    ),
    null,
  )
})
