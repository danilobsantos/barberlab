import "server-only"

import { auth } from "../auth"
import { db } from "../prisma"
import { findPlatformAdmin } from "./find-platform-admin"

export async function requirePlatformAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = await findPlatformAdmin(db, session.user.id)
  if (!userId) return null

  return {
    userId,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
}
