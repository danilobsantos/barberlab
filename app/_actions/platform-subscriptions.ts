"use server"

import { db } from "@/app/_lib/prisma"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import { subscriptionSchema } from "@/app/_lib/platform/subscription-schema"
import { lockAndGetTenantEntitlements } from "@/app/_lib/platform/entitlements"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function savePlatformSubscription(formData: FormData) {
  const admin = await requirePlatformAdmin()
  if (!admin) redirect("/painel")

  const parsed = subscriptionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/painel/assinaturas?error=invalid")

  const input = parsed.data
  const periodStart = new Date(`${input.currentPeriodStart}T00:00:00.000Z`)
  const periodEnd = new Date(`${input.currentPeriodEnd}T00:00:00.000Z`)

  try {
    await db.$transaction(
      async (tx) => {
        const entitlements = await lockAndGetTenantEntitlements(
          tx,
          input.barbershopId,
        )
        const [barbershop, plan, current] = await Promise.all([
          tx.barbershop.findUnique({
            where: { id: input.barbershopId },
            select: { id: true },
          }),
          tx.plan.findUnique({
            where: { id: input.planId },
            select: {
              id: true,
              priceMonthly: true,
              maxProfessionals: true,
              isActive: true,
            },
          }),
          tx.subscription.findFirst({
            where: {
              barbershopId: input.barbershopId,
              status: { not: "CANCELED" },
            },
            orderBy: { createdAt: "desc" },
          }),
        ])

        if (
          !barbershop ||
          !plan ||
          (!plan.isActive && current?.planId !== plan.id)
        ) {
          throw new Error("INVALID_SUBSCRIPTION_TARGET")
        }
        if (
          plan.maxProfessionals !== null &&
          entitlements.activeProfessionals > plan.maxProfessionals
        ) {
          throw new Error("PLAN_LIMIT_BELOW_CURRENT_USAGE")
        }

        const changingPlan = !!current && current.planId !== plan.id
        if (changingPlan) {
          await tx.subscription.update({
            where: { id: current.id },
            data: { status: "CANCELED", canceledAt: new Date() },
          })
        }

        const subscription =
          current && !changingPlan
            ? await tx.subscription.update({
                where: { id: current.id },
                data: {
                  status: input.status,
                  currentPeriodStart: periodStart,
                  currentPeriodEnd: periodEnd,
                  canceledAt: input.status === "CANCELED" ? new Date() : null,
                },
              })
            : await tx.subscription.create({
                data: {
                  barbershopId: input.barbershopId,
                  planId: plan.id,
                  status: input.status,
                  priceAtSubscription: plan.priceMonthly,
                  currentPeriodStart: periodStart,
                  currentPeriodEnd: periodEnd,
                  canceledAt: input.status === "CANCELED" ? new Date() : null,
                },
              })

        await tx.auditLog.create({
          data: {
            barbershopId: input.barbershopId,
            actorUserId: admin.userId,
            action: current ? "SUBSCRIPTION_UPDATED" : "SUBSCRIPTION_CREATED",
            entityType: "Subscription",
            entityId: subscription.id,
            metadata: {
              previousPlanId: current?.planId ?? null,
              previousStatus: current?.status ?? null,
              planId: plan.id,
              status: subscription.status,
              priceAtSubscription: subscription.priceAtSubscription.toString(),
            },
          },
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_SUBSCRIPTION_TARGET"
    ) {
      redirect("/painel/assinaturas?error=invalid")
    }
    if (
      error instanceof Error &&
      error.message === "PLAN_LIMIT_BELOW_CURRENT_USAGE"
    ) {
      redirect("/painel/assinaturas?error=limit")
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      redirect("/painel/assinaturas?error=conflict")
    }
    throw error
  }

  revalidatePath("/painel/assinaturas")
  revalidatePath("/painel")
  redirect("/painel/assinaturas?saved=1")
}
