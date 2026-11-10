import assert from "node:assert/strict"
import test from "node:test"
import type { Prisma } from "@prisma/client"
import { findPlatformAdmin } from "./find-platform-admin"

const store = (platformRole: "NONE" | "SUPER_ADMIN") =>
  ({
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        platformRole,
      }),
    },
  }) as unknown as Prisma.TransactionClient

test("allows only a user with the global SUPER_ADMIN role", async () => {
  assert.equal(
    await findPlatformAdmin(store("SUPER_ADMIN"), "root-user"),
    "root-user",
  )
  assert.equal(await findPlatformAdmin(store("NONE"), "shop-owner"), null)
})
