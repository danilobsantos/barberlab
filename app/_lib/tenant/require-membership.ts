import "server-only"

import { auth } from "../auth"
import { db } from "../prisma"
import { findMembershipForTenant } from "./find-membership"

export async function requireMembership(slug: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  return findMembershipForTenant(db, userId, slug)
}
