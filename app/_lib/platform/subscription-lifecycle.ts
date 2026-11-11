import "server-only"

import { SubscriptionStatus, type Prisma } from "@prisma/client"
import { db } from "@/app/_lib/prisma"
import { withTenantContext } from "@/app/_lib/database-context"
import {
  nextSubscriptionStatus,
  parseNonNegativeDays,
} from "./subscription-lifecycle-policy"

export {
  nextSubscriptionStatus,
  parseNonNegativeDays,
} from "./subscription-lifecycle-policy"

const DEFAULT_TRIAL_DAYS = 14
const DEFAULT_GRACE_DAYS = 7

export const subscriptionTrialDays = parseNonNegativeDays(
  process.env.SUBSCRIPTION_TRIAL_DAYS,
  DEFAULT_TRIAL_DAYS,
)
export const subscriptionGraceDays = parseNonNegativeDays(
  process.env.SUBSCRIPTION_GRACE_DAYS,
  DEFAULT_GRACE_DAYS,
)

// shortcut: the secured scheduler endpoint needs a host cron trigger; configure its schedule with deployment infrastructure.
export async function refreshSubscriptionLifecycle(
  barbershopId: string,
  now = new Date(),
): Promise<SubscriptionStatus | null> {
  return withTenantContext(barbershopId, async () => {
    const where = {
      barbershopId,
      status: { not: SubscriptionStatus.CANCELED },
    }
    const select = {
      id: true,
      status: true,
      currentPeriodEnd: true,
      updatedAt: true,
    } as const
    const current = await db.subscription.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      select,
    })
    if (!current) return null

    const nextStatus = nextSubscriptionStatus(
      current.status,
      current.currentPeriodEnd,
      now,
    )
    if (nextStatus === current.status) return current.status

    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Barbershop" WHERE id = ${barbershopId} FOR UPDATE`
      const subscription = await tx.subscription.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select,
      })
      if (!subscription) return null

      const status = nextSubscriptionStatus(
        subscription.status,
        subscription.currentPeriodEnd,
        now,
      )
      if (status === subscription.status) return status

      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status },
      })
      await tx.subscriptionEvent.create({
        data: {
          provider: "barberlab",
          externalEventId: `lifecycle:${subscription.id}:${status}:${subscription.updatedAt.getTime()}`,
          eventType: `SUBSCRIPTION_${status}`,
          barbershopId,
          subscriptionId: subscription.id,
          payload: {
            previousStatus: subscription.status,
            status,
            currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            graceDays: subscriptionGraceDays,
          } satisfies Prisma.InputJsonValue,
          processedAt: now,
        },
      })

      return status
    })
  })
}

export async function canTenantAcceptBookings(barbershopId: string) {
  const status = await refreshSubscriptionLifecycle(barbershopId)
  return (
    status === SubscriptionStatus.TRIALING ||
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.PAST_DUE
  )
}
