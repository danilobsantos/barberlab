import assert from "node:assert/strict"
import test from "node:test"
import { SubscriptionStatus } from "@prisma/client"
import {
  nextSubscriptionStatus,
  parseNonNegativeDays,
} from "./subscription-lifecycle-policy"

const now = new Date("2026-11-10T00:00:00.000Z")

test("expires trial and paid periods into the grace state", () => {
  const expired = new Date("2026-11-09T23:59:59.000Z")
  assert.equal(
    nextSubscriptionStatus(SubscriptionStatus.TRIALING, expired, now),
    SubscriptionStatus.PAST_DUE,
  )
  assert.equal(
    nextSubscriptionStatus(SubscriptionStatus.ACTIVE, expired, now),
    SubscriptionStatus.PAST_DUE,
  )
})

test("suspends after the configured grace period, but keeps grace inclusive", () => {
  const periodEnd = new Date("2026-11-01T00:00:00.000Z")
  assert.equal(
    nextSubscriptionStatus(SubscriptionStatus.PAST_DUE, periodEnd, now, 9),
    SubscriptionStatus.PAST_DUE,
  )
  assert.equal(
    nextSubscriptionStatus(SubscriptionStatus.PAST_DUE, periodEnd, now, 8),
    SubscriptionStatus.SUSPENDED,
  )
})

test("supports a zero-day grace period", () => {
  assert.equal(
    nextSubscriptionStatus(
      SubscriptionStatus.ACTIVE,
      new Date("2026-11-09T00:00:00.000Z"),
      now,
      0,
    ),
    SubscriptionStatus.SUSPENDED,
  )
})

test("keeps canceled subscriptions terminal and parses configured day counts", () => {
  assert.equal(
    nextSubscriptionStatus(
      SubscriptionStatus.CANCELED,
      new Date("2026-01-01T00:00:00.000Z"),
      now,
    ),
    SubscriptionStatus.CANCELED,
  )
  assert.equal(parseNonNegativeDays("21", 7), 21)
  assert.equal(parseNonNegativeDays("-1", 7), 7)
})
