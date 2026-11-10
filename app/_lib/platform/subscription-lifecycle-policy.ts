import { SubscriptionStatus } from "@prisma/client"

export function parseNonNegativeDays(
  value: string | undefined,
  fallback: number,
) {
  if (!value || !/^\d+$/.test(value)) return fallback
  const days = Number(value)
  return Number.isSafeInteger(days) ? days : fallback
}

export function nextSubscriptionStatus(
  status: SubscriptionStatus,
  periodEnd: Date,
  now: Date,
  graceDays = 7,
): SubscriptionStatus {
  if (
    (status === SubscriptionStatus.TRIALING ||
      status === SubscriptionStatus.ACTIVE) &&
    periodEnd <= now
  ) {
    return graceDays === 0
      ? SubscriptionStatus.SUSPENDED
      : SubscriptionStatus.PAST_DUE
  }

  const graceEndsAt = new Date(periodEnd)
  graceEndsAt.setUTCDate(graceEndsAt.getUTCDate() + graceDays)
  if (status === SubscriptionStatus.PAST_DUE && graceEndsAt < now) {
    return SubscriptionStatus.SUSPENDED
  }

  return status
}
