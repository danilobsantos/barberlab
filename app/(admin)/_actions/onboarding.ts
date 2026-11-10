"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"

export const completeOnboarding = async (slug: string) => {
  const admin = await requireAdminContext(slug, "manageSettings")
  if (!admin) return { ok: false as const }
  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  await db.user.update({
    where: { id: admin.userId },
    data: { onboardingDoneAt: new Date() },
  })

  return { ok: true as const }
}
