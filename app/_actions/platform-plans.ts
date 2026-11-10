"use server"

import { db } from "@/app/_lib/prisma"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import {
  planSchema,
  platformPlanActiveSchema,
} from "@/app/_lib/platform/plan-schema"
import { consumeRateLimit } from "@/app/_lib/rate-limit"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function savePlatformPlan(formData: FormData) {
  const admin = await requirePlatformAdmin()
  if (!admin) redirect("/painel")
  const limit = await consumeRateLimit("platformWrite", admin.userId)
  if (!limit.allowed) redirect("/painel/planos?error=rate-limit")

  const parsed = planSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/painel/planos?error=invalid")

  const { id, priceMonthly, features, ...fields } = parsed.data
  const data = {
    ...fields,
    priceMonthly: new Prisma.Decimal(priceMonthly),
    features: features as Prisma.InputJsonValue,
  }

  try {
    await db.$transaction(async (tx) => {
      const plan = id
        ? await tx.plan.update({ where: { id }, data })
        : await tx.plan.create({ data })
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          action: id ? "PLAN_UPDATED" : "PLAN_CREATED",
          entityType: "Plan",
          entityId: plan.id,
          metadata: { name: plan.name, slug: plan.slug },
        },
      })
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/painel/planos?error=slug")
    }
    throw error
  }

  revalidatePath("/painel/planos")
  redirect("/painel/planos?saved=1")
}

export async function setPlatformPlanActive(formData: FormData) {
  const admin = await requirePlatformAdmin()
  if (!admin) redirect("/painel")

  const limit = await consumeRateLimit("platformWrite", admin.userId)
  if (!limit.allowed) redirect("/painel/planos?error=rate-limit")
  const parsed = platformPlanActiveSchema.safeParse(
    Object.fromEntries(formData),
  )
  if (!parsed.success) redirect("/painel/planos?error=invalid")
  const { id, isActive } = parsed.data

  await db.$transaction(async (tx) => {
    const plan = await tx.plan.update({ where: { id }, data: { isActive } })
    await tx.auditLog.create({
      data: {
        actorUserId: admin.userId,
        action: isActive ? "PLAN_ACTIVATED" : "PLAN_DEACTIVATED",
        entityType: "Plan",
        entityId: id,
        metadata: { name: plan.name },
      },
    })
  })

  revalidatePath("/painel/planos")
  redirect("/painel/planos")
}
