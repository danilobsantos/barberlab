"use server"

import { BookingStatus } from "@prisma/client"
import { addMinutes } from "date-fns"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { canTenantAcceptBookings } from "../_lib/platform/subscription-lifecycle"
import { consumeRateLimit, rateLimitError } from "../_lib/rate-limit"
import { createBookingSchema } from "../_lib/booking-action-schema"
import { localDateTimeToInstant } from "../_lib/booking-availability"
import { getUnavailableIntervals } from "./get-bookings"

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
  const customer = await db.customer.findFirst({
    where: { barbershopId: service.barbershopId, userId: session.user.id },
    select: { id: true },
  })
  if (!customer) {
    return {
      ok: false as const,
      error:
        "Complete seu cadastro de cliente nesta barbearia (nome e telefone) antes de reservar.",
    }
  }

  try {
    await db.booking.create({
      data: {
        serviceId,
        userId: session.user.id,
        barbershopId: service.barbershopId,
        customerId: customer.id,
        professionalId,
        date: startsAt,
        startsAt,
        endsAt,
        priceSnapshot: service.price,
        durationMinutesSnapshot: service.durationMinutes,
      },
    })
  } catch (error) {
    const databaseDetails = `${error instanceof Prisma.PrismaClientKnownRequestError ? JSON.stringify(error.meta ?? {}) : ""} ${error instanceof Error ? error.message : ""}`
    if (
      databaseDetails.includes("Booking_professional_no_overlap") ||
      databaseDetails.includes("23P01")
    ) {
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
