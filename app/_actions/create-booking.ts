"use server"

import { BookingStatus } from "@prisma/client"
import { addMinutes } from "date-fns"
import { revalidatePath } from "next/cache"
import { auth } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { canTenantAcceptBookings } from "../_lib/platform/subscription-lifecycle"
import { consumeRateLimit, rateLimitError } from "../_lib/rate-limit"
import { createBookingSchema } from "../_lib/booking-action-schema"
import { localDateTimeToInstant } from "../_lib/booking-availability"
import { getUnavailableIntervals } from "./get-bookings"
import { isBookingConflictError } from "../_lib/booking-conflict"

const MAXIMO_DE_RESERVAS_EM_ABERTO = 3
const SLOT_CONFLICT = "Esse horário acabou de ser ocupado. Escolha outro."

export const createBooking = async (input: unknown) => {
  const session = await auth()
  if (!session?.user?.id)
    return { ok: false as const, error: "Você precisa estar logado." }

  const limit = await consumeRateLimit("createBooking", session.user.id)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsed = createBookingSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false as const, error: "Dados do agendamento inválidos." }
  const { serviceId, professionalId, date, time, slug } = parsed.data

  const service = await db.barbershopService.findFirst({
    where: {
      id: serviceId,
      isActive: true,
      barbershop: { status: "ACTIVE", ...(slug ? { slug } : {}) },
      professionals: {
        some: { professionalId, professional: { status: "ACTIVE" } },
      },
    },
    select: {
      id: true,
      barbershopId: true,
      durationMinutes: true,
      price: true,
      barbershop: { select: { timezone: true } },
    },
  })
  if (!service)
    return {
      ok: false as const,
      error: "Serviço ou profissional indisponível.",
    }

  if (!(await canTenantAcceptBookings(service.barbershopId))) {
    return {
      ok: false as const,
      error: "Esta barbearia não está aceitando novos agendamentos no momento.",
    }
  }

  if (session.user.accountType !== "CUSTOMER") {
    return {
      ok: false as const,
      error: "Use sua conta de cliente para agendar um horário.",
    }
  }

  const startsAt = localDateTimeToInstant(
    date,
    time,
    service.barbershop.timezone,
  )
  if (!startsAt || startsAt.getTime() <= Date.now()) {
    return { ok: false as const, error: "Escolha um horário válido no futuro." }
  }

  const slots = await getUnavailableIntervals({
    serviceId,
    professionalId,
    date,
    slug,
  })
  if (!slots.includes(time)) return { ok: false as const, error: SLOT_CONFLICT }

  const emAberto = await db.booking.count({
    where: {
      userId: session.user.id,
      status: BookingStatus.CONFIRMED,
      date: { gte: new Date() },
    },
  })
  if (emAberto >= MAXIMO_DE_RESERVAS_EM_ABERTO) {
    return {
      ok: false as const,
      error: `Você já tem ${MAXIMO_DE_RESERVAS_EM_ABERTO} horários marcados. Conclua ou cancele um para marcar outro.`,
    }
  }

  const endsAt = addMinutes(startsAt, service.durationMinutes)
  const [user, customer] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
    db.customer.findUnique({
      where: {
        barbershopId_userId: {
          barbershopId: service.barbershopId,
          userId: session.user.id,
        },
      },
      select: { id: true },
    }),
  ])
  if (!user) return { ok: false as const, error: "Conta não encontrada." }
  if (!customer && !user.phone?.trim()) {
    return {
      ok: false as const,
      error: "Informe seu telefone no perfil antes de reservar.",
    }
  }

  try {
    await db.$transaction(async (tx) => {
      const tenantCustomer = await tx.customer.upsert({
        where: {
          barbershopId_userId: {
            barbershopId: service.barbershopId,
            userId: session.user.id,
          },
        },
        update: {},
        create: {
          barbershopId: service.barbershopId,
          userId: session.user.id,
          name: user.name?.trim() || user.email.split("@")[0] || "Cliente",
          email: user.email,
          phone: user.phone!.trim(),
        },
        select: { id: true },
      })

      await tx.booking.create({
        data: {
          serviceId,
          userId: session.user.id,
          barbershopId: service.barbershopId,
          customerId: tenantCustomer.id,
          professionalId,
          date: startsAt,
          startsAt,
          endsAt,
          priceSnapshot: service.price,
          durationMinutesSnapshot: service.durationMinutes,
        },
      })
    })
  } catch (error) {
    if (isBookingConflictError(error)) {
      return { ok: false as const, error: SLOT_CONFLICT }
    }
    throw error
  }

  revalidatePath("/barbershops", "page")
  if (slug) revalidatePath(`/${slug}`)
  revalidatePath("/bookings", "page")
  revalidatePath("/dashboard")
  revalidatePath("/schedule")
  return { ok: true as const }
}
