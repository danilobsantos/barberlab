import type { Prisma } from "@prisma/client"

export interface TenantEntitlements {
  planId: string | null
  maxProfessionals: number | null
  activeProfessionals: number
  features: Record<string, boolean>
}

export async function lockAndGetTenantEntitlements(
  tx: Prisma.TransactionClient,
  barbershopId: string,
): Promise<TenantEntitlements> {
  await tx.$queryRaw`SELECT id FROM "Barbershop" WHERE id = ${barbershopId} FOR UPDATE`

  const [subscription, activeProfessionals] = await Promise.all([
    tx.subscription.findFirst({
      where: { barbershopId, status: { not: "CANCELED" } },
      orderBy: { createdAt: "desc" },
      select: {
        planId: true,
        plan: { select: { maxProfessionals: true, features: true } },
      },
    }),
    tx.professional.count({ where: { barbershopId, status: "ACTIVE" } }),
  ])

  const features =
    subscription?.plan.features &&
    typeof subscription.plan.features === "object" &&
    !Array.isArray(subscription.plan.features)
      ? Object.fromEntries(
          Object.entries(subscription.plan.features).filter(
            (entry): entry is [string, boolean] =>
              typeof entry[1] === "boolean",
          ),
        )
      : {}

  return {
    planId: subscription?.planId ?? null,
    maxProfessionals: subscription ? subscription.plan.maxProfessionals : 0,
    activeProfessionals,
    features,
  }
}

export function canUseFeature(
  entitlements: TenantEntitlements,
  feature: string,
): boolean {
  return entitlements.planId !== null && entitlements.features[feature] === true
}

export function isWithinProfessionalLimit(
  entitlements: TenantEntitlements,
  additional = 1,
): boolean {
  return (
    entitlements.maxProfessionals === null ||
    entitlements.activeProfessionals + additional <=
      entitlements.maxProfessionals
  )
}
