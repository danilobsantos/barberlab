import "server-only"

import { withTenantSlug } from "../database-context"

export async function resolveTenantBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null

  return withTenantSlug(slug, undefined, (tx) =>
    tx.barbershop.findFirst({
      where: { slug, status: "ACTIVE" },
      select: { id: true, slug: true, timezone: true, status: true },
    }),
  )
}
