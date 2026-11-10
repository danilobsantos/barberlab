import { db } from "@/app/_lib/prisma"
import { isAuthorizedCronRequest } from "@/app/_lib/platform/cron-auth"
import {
  refreshSubscriptionLifecycle,
  subscriptionGraceDays,
} from "@/app/_lib/platform/subscription-lifecycle"
import { SubscriptionStatus } from "@prisma/client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const secret = process.env.SUBSCRIPTION_CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "Subscription scheduler is not configured." },
      { status: 503 },
    )
  }
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const now = new Date()
  const graceCutoff = new Date(
    now.getTime() - subscriptionGraceDays * 24 * 60 * 60 * 1000,
  )
  const due = await db.subscription.findMany({
    where: {
      OR: [
        {
          status: {
            in: [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE],
          },
          currentPeriodEnd: { lte: now },
        },
        {
          status: SubscriptionStatus.PAST_DUE,
          currentPeriodEnd: { lt: graceCutoff },
        },
      ],
    },
    orderBy: { currentPeriodEnd: "asc" },
    take: 100,
    select: { id: true, barbershopId: true, status: true },
  })

  const shops = [
    ...new Map(
      due.map((subscription) => [subscription.barbershopId, subscription]),
    ).values(),
  ]
  const results = await Promise.all(
    shops.map(async (subscription) => {
      const status = await refreshSubscriptionLifecycle(
        subscription.barbershopId,
        now,
      )
      return status !== subscription.status
    }),
  )

  return NextResponse.json({
    scanned: shops.length,
    transitioned: results.filter(Boolean).length,
  })
}
