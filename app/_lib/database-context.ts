import "server-only"

import type { Prisma } from "@prisma/client"
import { db } from "./prisma"

export type DatabaseContext = {
  tenantId?: string
  userId?: string
  platformAdmin?: boolean
}

export async function setDatabaseContext(
  tx: Prisma.TransactionClient,
  context: DatabaseContext,
) {
  await tx.$queryRaw`SELECT
    set_config('app.tenant_id', ${context.tenantId ?? ""}, true),
    set_config('app.user_id', ${context.userId ?? ""}, true),
    set_config('app.platform_admin', ${context.platformAdmin ? "true" : "false"}, true)`
}

export async function withDatabaseContext<T>(
  context: DatabaseContext,
  // eslint-disable-next-line no-unused-vars
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(async (tx) => {
    await setDatabaseContext(tx, context)
    return callback(tx)
  })
}
