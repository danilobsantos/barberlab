import "server-only"

import type { Prisma } from "@prisma/client"
import { db, runWithTransactionClient, setTransactionContext } from "./prisma"

export type DatabaseContext = {
  tenantId?: string
  tenantSlug?: string
  userId?: string
  platformAdmin?: boolean
  invitationTokenHash?: string
}

export function withTenantSlug<T>(
  tenantSlug: string,
  userId: string | undefined,
  // eslint-disable-next-line no-unused-vars
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return withDatabaseContext({ tenantSlug, userId }, callback)
}

export function withInvitationToken<T>(
  invitationTokenHash: string,
  userId: string | undefined,
  // eslint-disable-next-line no-unused-vars
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return withDatabaseContext({ invitationTokenHash, userId }, callback)
}

export async function setDatabaseContext(
  tx: Prisma.TransactionClient,
  context: DatabaseContext,
) {
  await setTransactionContext(tx, context)
}

export async function withDatabaseContext<T>(
  context: DatabaseContext,
  // eslint-disable-next-line no-unused-vars
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
) {
  return db.$transaction(async (tx) => {
    await setDatabaseContext(tx, context)
    return runWithTransactionClient(tx, () => callback(tx))
  }, options)
}

export function withTenantContext<T>(
  tenantId: string,
  // eslint-disable-next-line no-unused-vars
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  userId?: string,
) {
  return withDatabaseContext({ tenantId, userId }, callback)
}

export function withPlatformContext<T>(
  userId: string,
  // eslint-disable-next-line no-unused-vars
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
) {
  return withDatabaseContext({ userId, platformAdmin: true }, callback, options)
}
