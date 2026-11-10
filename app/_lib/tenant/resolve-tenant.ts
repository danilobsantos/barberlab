import "server-only"

import { db } from "../prisma"

export async function resolveTenantBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null

  return db.barbershop.findUnique({
    where: { slug, status: "ACTIVE" },
    select: { id: true, slug: true, timezone: true, status: true },
  })
}
