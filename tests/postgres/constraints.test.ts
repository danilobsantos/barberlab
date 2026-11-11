import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import {
  isWithinProfessionalLimit,
  lockAndGetTenantEntitlements,
} from "../../app/_lib/platform/entitlements"
import {
  createInvitationToken,
  hashInvitationToken,
  isInvitationAcceptable,
  membershipInvitationExpiresAt,
} from "../../app/_lib/membership-invitation"

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
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: databaseUrl })),
})
const ids = {
  shop: randomUUID(),
  otherShop: randomUUID(),
  user: `postgres-test-${randomUUID()}`,
  customer: randomUUID(),
  service: randomUUID(),
  otherService: randomUUID(),
  professionals: [randomUUID(), randomUUID()],
  plan: randomUUID(),
  subscriptions: [randomUUID(), randomUUID(), randomUUID()],
  bookings: Array.from({ length: 5 }, () => randomUUID()),
  invitationTokenHash: "",
}

async function testTenantRls() {
  const role = `rls_test_${randomUUID().replaceAll("-", "")}`
  const connection = await pool.connect()
  await pool.query(`CREATE ROLE "${role}" NOLOGIN`)
  const tenantTables = [
    "Barbershop",
    "Membership",
    "OpeningHour",
    "BarbershopService",
    "Professional",
    "ProfessionalInvitation",
    "Customer",
    "ProfessionalService",
    "ProfessionalSchedule",
    "ProfessionalScheduleException",
    "Booking",
    "Subscription",
    "SubscriptionEvent",
    "AuditLog",
    "ScheduleBlock",
  ]
  await pool.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ${tenantTables.map((table) => `"${table}"`).join(", ")} TO "${role}"`,
  )
  try {
    await connection.query("BEGIN")
    await connection.query(`SET LOCAL ROLE "${role}"`)
    for (const table of tenantTables) {
      const hidden = await connection.query(`SELECT 1 FROM "${table}" LIMIT 1`)
      assert.deepEqual(
        hidden.rows,
        [],
        `${table} must fail closed without context`,
      )
    }
    const noContext = await connection.query(
      `SELECT "id" FROM "BarbershopService" WHERE "id" = ANY($1::text[])`,
      [[ids.service, ids.otherService]],
    )
    assert.deepEqual(noContext.rows, [])
    const noContextBookings = await connection.query(
      `SELECT "id" FROM "Booking" WHERE "id" = ANY($1::text[])`,
      [ids.bookings],
    )
    assert.deepEqual(noContextBookings.rows, [])
    await connection.query("COMMIT")

    await connection.query("BEGIN")
    await connection.query(`SET LOCAL ROLE "${role}"`)
    await connection.query(`SELECT set_config('app.tenant_id', $1, true)`, [
      ids.shop,
    ])
    const tenantRows = await connection.query(
      `SELECT "id" FROM "BarbershopService" WHERE "id" = ANY($1::text[]) ORDER BY "id"`,
      [[ids.service, ids.otherService]],
    )
    assert.deepEqual(
      tenantRows.rows.map((row) => row.id),
      [ids.service],
    )
    const tenantBookings = await connection.query(
      `SELECT "id" FROM "Booking" WHERE "id" = ANY($1::text[])`,
      [ids.bookings],
    )
    assert.ok(tenantBookings.rows.length > 0)
    const changed = await connection.query(
      `UPDATE "BarbershopService" SET "name" = 'cross-tenant-write' WHERE "id" = $1`,
      [ids.otherService],
    )
    assert.equal(changed.rowCount, 0)
    const deleted = await connection.query(
      `DELETE FROM "BarbershopService" WHERE "id" = $1`,
      [ids.otherService],
    )
    assert.equal(deleted.rowCount, 0)
    await assert.rejects(
      connection.query(
        `INSERT INTO "BarbershopService" ("id", "name", "description", "imageUrl", "price", "barbershopId", "updatedAt") VALUES ($1, 'cross-tenant-insert', '', '', 10, $2, NOW())`,
        [randomUUID(), ids.otherShop],
      ),
      (error: { code?: string }) => error.code === "42501",
    )
    await connection.query("ROLLBACK")

    await connection.query("BEGIN")
    await connection.query(`SET LOCAL ROLE "${role}"`)
    await connection.query(`SELECT set_config('app.user_id', $1, true)`, [
      ids.user,
    ])
    const ownBookings = await connection.query(
      `SELECT "id" FROM "Booking" WHERE "id" = ANY($1::text[])`,
      [ids.bookings],
    )
    assert.ok(ownBookings.rows.length > 0)
    await connection.query("ROLLBACK")

    await connection.query("BEGIN")
    await connection.query(`SET LOCAL ROLE "${role}"`)
    await connection.query(
      `SELECT set_config('app.invitation_token_hash', $1, true)`,
      [ids.invitationTokenHash],
    )
    const tokenLookup = await connection.query(
      `SELECT "professionalId", "barbershopId" FROM "ProfessionalInvitation" WHERE "tokenHash" = $1`,
      [ids.invitationTokenHash],
    )
    assert.equal(tokenLookup.rows.length, 1)
    await connection.query(`SELECT set_config('app.tenant_id', $1, true)`, [
      tokenLookup.rows[0].barbershopId,
    ])
    const invitationTenant = await connection.query(
      `SELECT p."barbershopId" FROM "ProfessionalInvitation" i JOIN "Professional" p ON p."id" = i."professionalId" WHERE i."tokenHash" = $1`,
      [ids.invitationTokenHash],
    )
    assert.deepEqual(invitationTenant.rows, [{ barbershopId: ids.shop }])
    await connection.query("ROLLBACK")

    await connection.query("BEGIN")
    await connection.query(`SET LOCAL ROLE "${role}"`)
    const afterCommit = await connection.query(
      `SELECT "id" FROM "BarbershopService" WHERE "id" = ANY($1::text[])`,
      [[ids.service, ids.otherService]],
    )
    assert.deepEqual(afterCommit.rows, [])
    await connection.query("ROLLBACK")
  } finally {
    await connection.query("ROLLBACK")
    connection.release()
    await pool.query(`DROP OWNED BY "${role}"`)
    await pool.query(`DROP ROLE "${role}"`)
  }
}

async function assertTenantRlsCoverage() {
  const expectedTables = [
    "Barbershop",
    "Membership",
    "OpeningHour",
    "BarbershopService",
    "Professional",
    "ProfessionalInvitation",
    "Customer",
    "ProfessionalService",
    "ProfessionalSchedule",
    "ProfessionalScheduleException",
    "Booking",
    "Subscription",
    "SubscriptionEvent",
    "AuditLog",
    "ScheduleBlock",
  ]
  const result = await pool.query(
    `SELECT c.relname AS name, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])`,
    [expectedTables],
  )
  assert.deepEqual(
    result.rows
      .filter((table) => table.enabled && table.forced)
      .map((table) => table.name)
      .sort(),
    [...expectedTables].sort(),
    "Every tenant-owned table must enable and force row-level security",
  )
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
      ("id", "userId", "serviceId", "date", "status", "barbershopId", "professionalId", "customerId", "startsAt", "endsAt", "updatedAt")
      VALUES ($1, $2, $3, $4::timestamptz, $8::"BookingStatus", $6, $7, $9, $4::timestamptz, $5::timestamptz, NOW())`,
    [
      id,
      ids.user,
      ids.service,
      startsAt,
      endsAt,
      ids.shop,
      professionalId,
      status,
      ids.customer,
    ],
  )
}

test("PostgreSQL enforces booking, subscription, tenant invitation, and membership constraints", async () => {
  try {
    await assertTenantRlsCoverage()
    await pool.query(
      `INSERT INTO "Barbershop" ("id", "name", "slug", "address", "phones", "description", "imageUrl", "updatedAt")
       VALUES ($1, 'Integration test', $2, '', ARRAY[]::TEXT[], '', '', NOW()),
              ($3, 'Other tenant', $4, '', ARRAY[]::TEXT[], '', '', NOW())`,
      [
        ids.shop,
        `integration-${ids.shop}`,
        ids.otherShop,
        `integration-${ids.otherShop}`,
      ],
    )
    await pool.query(
      `INSERT INTO "User" ("id", "email", "updatedAt") VALUES ($1, $2, NOW())`,
      [ids.user, `${ids.user}@example.test`],
    )
    await pool.query(
      `INSERT INTO "Customer" ("id", "barbershopId", "userId", "name", "phone", "updatedAt") VALUES ($1, $2, $3, 'Test customer', '11999999999', NOW())`,
      [ids.customer, ids.shop, ids.user],
    )
    await pool.query(
      `INSERT INTO "BarbershopService" ("id", "name", "description", "imageUrl", "price", "barbershopId", "updatedAt")
       VALUES ($1, 'Test service', '', '', 10, $2, NOW())`,
      [ids.service, ids.shop],
    )
    await pool.query(
      `INSERT INTO "BarbershopService" ("id", "name", "description", "imageUrl", "price", "barbershopId", "updatedAt")
       VALUES ($1, 'Other tenant service', '', '', 10, $2, NOW())`,
      [ids.otherService, ids.otherShop],
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
    const invitationToken = createInvitationToken()
    const invitationExpiry = membershipInvitationExpiresAt(new Date())
    await prisma.professionalInvitation.create({
      data: {
        professionalId: ids.professionals[0],
        barbershopId: ids.shop,
        email: "staff@example.test",
        tokenHash: hashInvitationToken(invitationToken),
        expiresAt: invitationExpiry,
      },
    })
    const invitation = await prisma.professionalInvitation.findUniqueOrThrow({
      where: { tokenHash: hashInvitationToken(invitationToken) },
      include: { professional: { select: { barbershopId: true } } },
    })
    assert.equal(invitation.professional.barbershopId, ids.shop)

    const lookupToken = createInvitationToken()
    ids.invitationTokenHash = hashInvitationToken(lookupToken)
    await prisma.professionalInvitation.create({
      data: {
        professionalId: ids.professionals[1],
        barbershopId: ids.shop,
        email: "staff-lookup@example.test",
        tokenHash: ids.invitationTokenHash,
        expiresAt: membershipInvitationExpiresAt(new Date()),
      },
    })

    const resentToken = createInvitationToken()
    await prisma.professionalInvitation.update({
      where: { professionalId: ids.professionals[0] },
      data: {
        tokenHash: hashInvitationToken(resentToken),
        expiresAt: membershipInvitationExpiresAt(new Date()),
        canceledAt: null,
      },
    })
    assert.equal(
      await prisma.professionalInvitation.findUnique({
        where: { tokenHash: hashInvitationToken(invitationToken) },
      }),
      null,
    )
    const resentInvitation =
      await prisma.professionalInvitation.findUniqueOrThrow({
        where: { tokenHash: hashInvitationToken(resentToken) },
      })
    assert.equal(
      isInvitationAcceptable(resentInvitation, "staff@example.test"),
      true,
    )
    const canceledAt = new Date()
    await prisma.professionalInvitation.update({
      where: { id: resentInvitation.id },
      data: { canceledAt },
    })
    assert.equal(
      isInvitationAcceptable(
        { ...resentInvitation, canceledAt },
        "staff@example.test",
      ),
      false,
    )
    const activeToken = createInvitationToken()
    await prisma.professionalInvitation.update({
      where: { id: resentInvitation.id },
      data: {
        tokenHash: hashInvitationToken(activeToken),
        expiresAt: membershipInvitationExpiresAt(new Date()),
        canceledAt: null,
      },
    })
    const activeInvitation =
      await prisma.professionalInvitation.findUniqueOrThrow({
        where: { tokenHash: hashInvitationToken(activeToken) },
      })
    assert.equal(
      isInvitationAcceptable(activeInvitation, "staff@example.test"),
      true,
    )
    const acceptCondition = {
      id: activeInvitation.id,
      tokenHash: hashInvitationToken(activeToken),
      acceptedAt: null,
      canceledAt: null,
      expiresAt: { gt: new Date() },
    }
    const acceptAttempts = await Promise.all([
      prisma.professionalInvitation.updateMany({
        where: acceptCondition,
        data: { acceptedAt: new Date() },
      }),
      prisma.professionalInvitation.updateMany({
        where: acceptCondition,
        data: { acceptedAt: new Date() },
      }),
    ])
    assert.deepEqual(
      acceptAttempts.map((attempt) => attempt.count).sort(),
      [0, 1],
    )

    await assert.rejects(
      pool.query(
        `INSERT INTO "ProfessionalService" ("barbershopId", "professionalId", "serviceId") VALUES ($1, $2, $3)`,
        [ids.shop, ids.professionals[0], ids.otherService],
      ),
      (error: { code?: string }) => error.code === "23503",
    )
    await pool.query(
      `INSERT INTO "Plan" ("id", "name", "slug", "description", "priceMonthly", "maxProfessionals", "features", "updatedAt")
       VALUES ($1, 'Test plan', $2, '', 10, 3, '{}'::jsonb, NOW())`,
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
      JSON.stringify(
        contenders.map((result) =>
          result.status === "rejected"
            ? {
                message: String(result.reason),
                code: result.reason?.code,
                detail: result.reason?.detail,
              }
            : result,
        ),
      ),
    )
    const rejected = contenders.find((result) => result.status === "rejected")
    assert.ok(rejected && rejected.status === "rejected")
    assert.ok(
      ["23P01", "40P01"].includes(
        (rejected.reason as { code?: string }).code ?? "",
      ),
    )

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
    await testTenantRls()

    const additions = await Promise.all([
      prisma.$transaction(async (tx) => {
        const entitlements = await lockAndGetTenantEntitlements(tx, ids.shop)
        if (!isWithinProfessionalLimit(entitlements)) return false
        await tx.professional.create({
          data: { barbershopId: ids.shop, name: `Concurrent ${randomUUID()}` },
        })
        return true
      }),
      prisma.$transaction(async (tx) => {
        const entitlements = await lockAndGetTenantEntitlements(tx, ids.shop)
        if (!isWithinProfessionalLimit(entitlements)) return false
        await tx.professional.create({
          data: { barbershopId: ids.shop, name: `Concurrent ${randomUUID()}` },
        })
        return true
      }),
    ])
    assert.equal(additions.filter(Boolean).length, 1)
  } finally {
    await pool.query(`DELETE FROM "Booking" WHERE "id" = ANY($1::text[])`, [
      ids.bookings,
    ])
    await pool.query(`DELETE FROM "Barbershop" WHERE "id" = $1`, [ids.shop])
    await pool.query(`DELETE FROM "Barbershop" WHERE "id" = $1`, [
      ids.otherShop,
    ])
    await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [ids.user])
    await prisma.$disconnect()
    await pool.end()
  }
})
