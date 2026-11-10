"use server"

import { db } from "@/app/_lib/prisma"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import { platformBarbershopStatusSchema } from "@/app/_lib/platform/barbershop-status-schema"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function setPlatformBarbershopStatus(formData: FormData) {
  const admin = await requirePlatformAdmin()
  if (!admin) redirect("/painel")

  const parsed = platformBarbershopStatusSchema.safeParse(
    Object.fromEntries(formData),
  )
  if (!parsed.success) redirect("/painel/barbearias?error=invalid")

  const { barbershopId, status } = parsed.data
  const result = await db.$transaction(async (tx) => {
    const barbershop = await tx.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true, name: true, status: true },
    })
    if (
      !barbershop ||
      !["ACTIVE", "SUSPENDED"].includes(barbershop.status) ||
      barbershop.status === status
    ) {
      return false
    }

    const updated = await tx.barbershop.updateMany({
      where: { id: barbershopId, status: barbershop.status },
      data: { status },
    })
    if (!updated.count) return false
    await tx.auditLog.create({
      data: {
        barbershopId,
        actorUserId: admin.userId,
        action:
          status === "SUSPENDED"
            ? "BARBERSHOP_SUSPENDED"
            : "BARBERSHOP_ACTIVATED",
        entityType: "Barbershop",
        entityId: barbershopId,
        metadata: {
          name: barbershop.name,
          previousStatus: barbershop.status,
          status,
        },
      },
    })
    return true
  })

  if (!result) redirect("/painel/barbearias?error=invalid")
  revalidatePath("/painel/barbearias")
  revalidatePath("/painel/assinaturas")
  revalidatePath("/")
  redirect("/painel/barbearias?saved=1")
}
