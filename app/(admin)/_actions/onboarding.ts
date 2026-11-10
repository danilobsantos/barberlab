"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { db } from "@/app/_lib/prisma"

export const completeOnboarding = async (slug: string) => {
  const admin = await requireAdminContext(slug)
  if (!admin) return { ok: false as const }

  await db.user.update({
    where: { id: admin.userId },
    data: { onboardingDoneAt: new Date() },
  })

  return { ok: true as const }
}
