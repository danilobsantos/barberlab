import type { Prisma } from "@prisma/client"

type PlatformAdminStore = Pick<Prisma.TransactionClient, "user">

export async function findPlatformAdmin(
  store: PlatformAdminStore,
  userId: string,
) {
  const user = await store.user.findUnique({
    where: { id: userId },
    select: { id: true, platformRole: true },
  })

  return user?.platformRole === "SUPER_ADMIN" ? user.id : null
}
