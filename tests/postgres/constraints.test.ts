import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.slice(1)
  : undefined

if (
  process.env.CI_POSTGRES_TESTS !== "true" ||
  databaseName !== "barberlab_test"
) {
  throw new Error(
    "PostgreSQL integration tests require CI_POSTGRES_TESTS=true and DATABASE_URL targeting barberlab_test (disposable database).",
  )
}

const pool = new Pool({ connectionString: databaseUrl })
const ids = {
  shop: randomUUID(),
  user: `postgres-test-${randomUUID()}`,
  service: randomUUID(),
  professionals: [randomUUID(), randomUUID()],
  plan: randomUUID(),
  subscriptions: [randomUUID(), randomUUID(), randomUUID()],
  bookings: Array.from({ length: 5 }, () => randomUUID()),
}

async function insertBooking(
  id: string,
  professionalId: string,
  startsAt: string,
  endsAt: string,
  status = "CONFIRMED",
) {
  await pool.query(
    `INSERT INTO "Booking"
      ("id", "userId", "serviceId", "date", "status", "barbershopId", "professionalId", "startsAt", "endsAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $8::"BookingStatus", $6, $7, $4, $5, NOW())`,
    [
      id,
      ids.user,
      ids.service,
      startsAt,
      endsAt,
      ids.shop,
      professionalId,
      status,
    ],
  )
}

test("PostgreSQL enforces booking overlap and one current subscription per tenant", async () => {
  try {
    await pool.query(
      `INSERT INTO "Barbershop" ("id", "name", "slug", "address", "phones", "description", "imageUrl", "updatedAt")
       VALUES ($1, 'Integration test', $2, '', ARRAY[]::TEXT[], '', '', NOW())`,
      [ids.shop, `integration-${ids.shop}`],
    )
    await pool.query(
      `INSERT INTO "User" ("id", "email", "updatedAt") VALUES ($1, $2, NOW())`,
      [ids.user, `${ids.user}@example.test`],
    )
    await pool.query(
      `INSERT INTO "BarbershopService" ("id", "name", "description", "imageUrl", "price", "barbershopId", "updatedAt")
       VALUES ($1, 'Test service', '', '', 10, $2, NOW())`,
      [ids.service, ids.shop],
    )
    for (const [index, professionalId] of ids.professionals.entries()) {
      await pool.query(
        `INSERT INTO "Professional" ("id", "barbershopId", "name", "updatedAt") VALUES ($1, $2, $3, NOW())`,
        [professionalId, ids.shop, `Professional ${index}`],
      )
      await pool.query(
        `INSERT INTO "ProfessionalService" ("barbershopId", "professionalId", "serviceId") VALUES ($1, $2, $3)`,
        [ids.shop, professionalId, ids.service],
      )
    }
    await pool.query(
      `INSERT INTO "Plan" ("id", "name", "slug", "description", "priceMonthly", "features", "updatedAt")
       VALUES ($1, 'Test plan', $2, '', 10, '{}'::jsonb, NOW())`,
      [ids.plan, `integration-${ids.plan}`],
    )

    const periodStart = new Date("2026-01-01T00:00:00.000Z")
    const periodEnd = new Date("2027-01-01T00:00:00.000Z")
    await pool.query(
      `INSERT INTO "Subscription" ("id", "barbershopId", "planId", "status", "priceAtSubscription", "currentPeriodStart", "currentPeriodEnd", "updatedAt")
       VALUES ($1, $2, $3, 'TRIALING', 10, $4, $5, NOW()),
              ($6, $2, $3, 'CANCELED', 10, $4, $5, NOW()),
              ($7, $2, $3, 'CANCELED', 10, $4, $5, NOW())`,
      [
        ids.subscriptions[0],
        ids.shop,
        ids.plan,
        periodStart,
        periodEnd,
        ids.subscriptions[1],
        ids.subscriptions[2],
      ],
    )

    await assert.rejects(
      pool.query(
        `INSERT INTO "Subscription" ("id", "barbershopId", "planId", "status", "priceAtSubscription", "currentPeriodStart", "currentPeriodEnd", "updatedAt")
         VALUES ($1, $2, $3, 'ACTIVE', 10, $4, $5, NOW())`,
        [randomUUID(), ids.shop, ids.plan, periodStart, periodEnd],
      ),
      (error: { code?: string }) => error.code === "23505",
    )

    const startsAt = "2027-01-01T10:00:00.000Z"
    const endsAt = "2027-01-01T10:30:00.000Z"
    const contenders = await Promise.allSettled([
      insertBooking(ids.bookings[0], ids.professionals[0], startsAt, endsAt),
      insertBooking(ids.bookings[1], ids.professionals[0], startsAt, endsAt),
    ])
    assert.equal(
      contenders.filter((result) => result.status === "fulfilled").length,
      1,
    )
    const rejected = contenders.find((result) => result.status === "rejected")
    assert.ok(rejected && rejected.status === "rejected")
    assert.equal((rejected.reason as { code?: string }).code, "23P01")

    await insertBooking(
      ids.bookings[2],
      ids.professionals[0],
      endsAt,
      "2027-01-01T11:00:00.000Z",
    )
    await insertBooking(ids.bookings[3], ids.professionals[1], startsAt, endsAt)
    await insertBooking(
      ids.bookings[4],
      ids.professionals[0],
      startsAt,
      endsAt,
      "CANCELED",
    )
  } finally {
    await pool.query(`DELETE FROM "Booking" WHERE "id" = ANY($1::text[])`, [
      ids.bookings,
    ])
    await pool.query(`DELETE FROM "Barbershop" WHERE "id" = $1`, [ids.shop])
    await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [ids.user])
    await pool.end()
  }
})
