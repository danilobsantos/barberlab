import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { Pool } from "pg"
import test from "node:test"

const databaseUrl = process.env.DATABASE_URL
const database = databaseUrl
  ? new URL(databaseUrl).pathname.slice(1)
  : undefined

if (process.env.CI_POSTGRES_TESTS !== "true" || database !== "barberlab_test") {
  throw new Error(
    "Server Action integration tests require CI_POSTGRES_TESTS=true and DATABASE_URL targeting barberlab_test.",
  )
}

test("tenant A Server Actions cannot read, change, or delete tenant B services under runtime RLS", async () => {
  const ownerPool = new Pool({ connectionString: databaseUrl })
  const role = `action_test_${randomUUID().replaceAll("-", "")}`
  const password = randomUUID()
  const shopA = randomUUID()
  const shopB = randomUUID()
  const serviceA = randomUUID()
  const serviceB = randomUUID()
  const slugA = `action-a-${shopA}`
  let actionDb: typeof import("@/app/_lib/prisma") | undefined

  try {
    await ownerPool.query(
      `CREATE ROLE "${role}" LOGIN PASSWORD '${password}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`,
    )
    const roleFlags = await ownerPool.query(
      "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1",
      [role],
    )
    assert.deepEqual(roleFlags.rows, [{ rolsuper: false, rolbypassrls: false }])
    await ownerPool.query(`GRANT CONNECT ON DATABASE ${database} TO "${role}"`)
    await ownerPool.query(`GRANT USAGE ON SCHEMA public TO "${role}"`)
    await ownerPool.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "Barbershop", "BarbershopService", "Booking" TO "${role}"`,
    )
    await ownerPool.query(
      `INSERT INTO "Barbershop" ("id", "name", "slug", "address", "phones", "description", "imageUrl", "updatedAt")
       VALUES ($1, 'Action tenant A', $2, '', ARRAY[]::TEXT[], '', '', NOW()),
              ($3, 'Action tenant B', $4, '', ARRAY[]::TEXT[], '', '', NOW())`,
      [shopA, slugA, shopB, `action-b-${shopB}`],
    )
    await ownerPool.query(
      `INSERT INTO "BarbershopService" ("id", "name", "description", "imageUrl", "price", "barbershopId", "updatedAt")
       VALUES ($1, 'Tenant A service', '', '', 10, $2, NOW()),
              ($3, 'Tenant B service', '', '', 10, $4, NOW())`,
      [serviceA, shopA, serviceB, shopB],
    )

    const runtimeUrl = new URL(databaseUrl!)
    runtimeUrl.username = role
    runtimeUrl.password = password
    process.env.DATABASE_URL = runtimeUrl.toString()
    globalThis.__serverActionAdmin = {
      slug: slugA,
      context: { userId: `owner-${shopA}`, barbershopId: shopA },
    }

    const [{ setServiceActive, deleteService }, prismaModule] =
      await Promise.all([
        import("../../app/(admin)/_actions/services"),
        import("@/app/_lib/prisma"),
      ])
    actionDb = prismaModule

    const deniedReadAndDelete = await deleteService(serviceB, slugA)
    assert.deepEqual(deniedReadAndDelete, {
      ok: false,
      error: "Serviço não encontrado.",
    })

    const deniedUpdate = await setServiceActive(serviceB, false, slugA)
    assert.deepEqual(deniedUpdate, {
      ok: false,
      error: "Serviço não encontrado.",
    })

    const allowedUpdate = await setServiceActive(serviceA, false, slugA)
    assert.deepEqual(allowedUpdate, { ok: true })

    const services = await ownerPool.query(
      `SELECT "id", "isActive" FROM "BarbershopService" WHERE "id" = ANY($1::text[]) ORDER BY "id"`,
      [[serviceA, serviceB]],
    )
    const activeById = new Map(
      services.rows.map((service) => [
        service.id as string,
        service.isActive as boolean,
      ]),
    )
    assert.equal(activeById.get(serviceA), false)
    assert.equal(activeById.get(serviceB), true)
  } finally {
    delete globalThis.__serverActionAdmin
    if (actionDb) {
      await actionDb.db.$disconnect()
      await actionDb.getPool().end()
    }
    await ownerPool.query(
      `DELETE FROM "Barbershop" WHERE "id" = ANY($1::text[])`,
      [[shopA, shopB]],
    )
    await ownerPool.query(`DROP OWNED BY "${role}"`)
    await ownerPool.query(`DROP ROLE IF EXISTS "${role}"`)
    await ownerPool.end()
  }
})

declare global {
  // eslint-disable-next-line no-unused-vars
  var __serverActionAdmin:
    | { slug: string; context: { userId: string; barbershopId: string } }
    | undefined
}
