import type { Prisma } from "@prisma/client"

type MembershipStore = Pick<
  Prisma.TransactionClient,
  "barbershop" | "membership"
>

export async function findMembershipForTenant(
  store: MembershipStore,
  userId: string,
  slug: string,
) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null

  const tenant = await store.barbershop.findFirst({
    where: { slug, status: { in: ["ACTIVE", "PENDING_SETUP"] } },
    select: { id: true, slug: true, timezone: true },
  })
  if (!tenant) return null

  const membership = await store.membership.findFirst({
    where: { userId, barbershopId: tenant.id, status: "ACTIVE" },
    select: { role: true },
  })
  if (!membership) return null

  return {
    userId,
    barbershopId: tenant.id,
    slug: tenant.slug,
    timezone: tenant.timezone,
    role: membership.role,
  }
}
