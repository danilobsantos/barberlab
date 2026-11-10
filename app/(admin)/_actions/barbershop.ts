"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { db } from "@/app/_lib/prisma"
import { revalidatePath } from "next/cache"
import { barbershopProfileSchema } from "../_lib/barbershop-schema"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"

export const saveBarbershopProfile = async (input: unknown, slug: string) => {
  const admin = await requireAdminContext(slug, "manageSettings")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = barbershopProfileSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { phones, ...rest } = parsed.data

  await db.barbershop.update({
    where: { id: admin.barbershopId },
    data: { ...rest, phones: phones.map((p) => p.trim()).filter(Boolean) },
  })

  revalidatePath("/settings")
  if (slug) revalidatePath(`/painel/${slug}/settings`)
  if (slug) revalidatePath(`/barbershops/${admin.barbershopId}`)
  revalidatePath("/")
  revalidatePath("/barbershops")
  revalidatePath(`/barbershops/${admin.barbershopId}`)

  return { ok: true as const }
}
