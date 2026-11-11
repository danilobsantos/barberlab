"use server"

import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { serviceSchema } from "../_lib/service-schema"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { withTenantContext } from "@/app/_lib/database-context"

const revalidateServices = (slug?: string) => {
  revalidatePath("/services")
  revalidatePath("/dashboard")
  revalidatePath("/barbershops")
  revalidatePath("/")
  if (slug) {
    revalidatePath(`/painel/${slug}/services`)
    revalidatePath(`/painel/${slug}/dashboard`)
  }
}

export const upsertService = async (input: unknown, slug: string) => {
  const admin = await requireAdminContext(slug, "manageServices")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { id, price, ...rest } = parsed.data
  const data = { ...rest, price: new Prisma.Decimal(price.toFixed(2)) }

  if (id) {
    const result = await withTenantContext(
      admin.barbershopId,
      (tx) =>
        tx.barbershopService.updateMany({
          where: { id, barbershopId: admin.barbershopId },
          data,
        }),
      admin.userId,
    )

    if (result.count === 0) {
      return { ok: false as const, error: "Serviço não encontrado." }
    }
  } else {
    await withTenantContext(
      admin.barbershopId,
      (tx) =>
        tx.barbershopService.create({
          data: { ...data, barbershopId: admin.barbershopId },
        }),
      admin.userId,
    )
  }

  revalidateServices(slug)

  return { ok: true as const }
}

export const setServiceActive = async (
  serviceId: string,
  isActive: boolean,
  slug: string,
) => {
  const admin = await requireAdminContext(slug, "manageServices")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const result = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.barbershopService.updateMany({
        where: { id: serviceId, barbershopId: admin.barbershopId },
        data: { isActive },
      }),
    admin.userId,
  )

  if (result.count === 0) {
    return { ok: false as const, error: "Serviço não encontrado." }
  }

  revalidateServices(slug)

  return { ok: true as const }
}

export const deleteService = async (serviceId: string, slug: string) => {
  const admin = await requireAdminContext(slug, "manageServices")
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const service = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.barbershopService.findFirst({
        where: { id: serviceId, barbershopId: admin.barbershopId },
        select: { _count: { select: { bookings: true } } },
      }),
    admin.userId,
  )

  if (!service) {
    return { ok: false as const, error: "Serviço não encontrado." }
  }

  if (service._count.bookings > 0) {
    return {
      ok: false as const,
      error:
        "Esse serviço já tem agendamentos e não pode ser excluído. Desative-o para tirá-lo do site.",
    }
  }

  const deleted = await withTenantContext(
    admin.barbershopId,
    (tx) =>
      tx.barbershopService.deleteMany({
        where: { id: serviceId, barbershopId: admin.barbershopId },
      }),
    admin.userId,
  )
  if (deleted.count === 0) {
    return { ok: false as const, error: "Serviço não encontrado." }
  }

  revalidateServices(slug)

  return { ok: true as const }
}
