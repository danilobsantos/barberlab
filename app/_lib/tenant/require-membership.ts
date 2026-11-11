import "server-only"

import { auth } from "../auth"
import { withTenantSlug } from "../database-context"
import { findMembershipForTenant } from "./find-membership"

export async function requireMembership(slug: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  return withTenantSlug(slug, userId, (tx) =>
    findMembershipForTenant(tx, userId, slug),
  )
}
