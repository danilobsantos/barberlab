import { AsyncLocalStorage } from "node:async_hooks"
import { PrismaClient, type Prisma } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-unused-vars
  var cachedPrisma: PrismaClient | undefined
  // eslint-disable-next-line no-unused-vars
  var cachedPool: Pool | undefined
}

const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>()

export const runWithTransactionClient = <T>(
  tx: Prisma.TransactionClient,
  callback: () => T,
) => transactionStorage.run(tx, callback)

export async function setTransactionContext(
  tx: Prisma.TransactionClient,
  context: {
    tenantId?: string
    tenantSlug?: string
    userId?: string
    platformAdmin?: boolean
    invitationTokenHash?: string
  },
) {
  await tx.$queryRaw`SELECT
    set_config('app.tenant_id', ${context.tenantId ?? ""}, true),
    set_config('app.user_id', ${context.userId ?? ""}, true),
    set_config('app.platform_admin', ${context.platformAdmin ? "true" : "false"}, true),
    set_config('app.invitation_token_hash', ${context.invitationTokenHash ?? ""}, true),
    set_config('app.tenant_slug', ${context.tenantSlug ?? ""}, true)`
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please check your .env.local file.",
    )
  }

  if (!globalThis.cachedPool) {
    const url = new URL(connectionString)
    const sslDisabled =
      url.searchParams.get("sslmode") === "disable" ||
      process.env.DATABASE_SSL === "false" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "postgres" ||
      url.hostname === "db"

    url.searchParams.delete("sslmode")
    url.searchParams.delete("channel_binding")

    globalThis.cachedPool = new Pool({
      connectionString: url.toString(),
      ssl: sslDisabled ? false : true,
    })
  }

  if (!globalThis.cachedPrisma) {
    const adapter = new PrismaPg(globalThis.cachedPool)
    globalThis.cachedPrisma = new PrismaClient({ adapter })
  }

  return globalThis.cachedPrisma
}

export const getPool = (): Pool => {
  if (!globalThis.cachedPool) createPrismaClient()
  return globalThis.cachedPool!
}

export const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const transaction = transactionStorage.getStore()
    if (transaction) {
      if (prop === "$transaction") {
        return (callback: unknown) =>
          typeof callback === "function"
            ? callback(transaction)
            : Promise.all(callback as Promise<unknown>[])
      }
      return (transaction as any)[prop]
    }

    if (!globalThis.cachedPrisma) {
      createPrismaClient()
    }
    return (globalThis.cachedPrisma as any)[prop]
  },
})
