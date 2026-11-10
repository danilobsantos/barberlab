"use server"

import { BookingStatus } from "@prisma/client"
import { addMinutes, endOfDay, startOfDay } from "date-fns"
import { auth } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { withDefaults } from "../_lib/opening-hours"
import { consumeRateLimit, getClientIp } from "../_lib/rate-limit"
import {
  serviceIdSchema,
  unavailableIntervalsSchema,
} from "../_lib/booking-action-schema"

export interface UnavailableInterval {
  startsAt: Date
  endsAt: Date
}

export const getUnavailableIntervals = async (
  input: unknown,
): Promise<UnavailableInterval[]> => {
  const session = await auth()
  if (!session?.user) return []
  const parsed = unavailableIntervalsSchema.safeParse(input)
  if (!parsed.success) return []
  const { serviceId, date } = parsed.data

  const limit = await consumeRateLimit("readSchedule", session.user.id)
  if (!limit.allowed) return []

  const service = await db.barbershopService.findFirst({
    where: {
      id: serviceId,
      isActive: true,
      barbershop: { status: "ACTIVE" },
    },
    select: { barbershopId: true },
  })
  if (!service) return []

  const from = startOfDay(date)
  const to = endOfDay(date)

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: BookingStatus.CANCELED },
        service: { barbershopId: service.barbershopId },
      },
      select: {
        date: true,
        service: { select: { durationMinutes: true } },
      },
    }),
    db.scheduleBlock.findMany({
      where: {
        barbershopId: service.barbershopId,
        startsAt: { lte: to },
        endsAt: { gte: from },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ])

  return [
    ...bookings.map((booking) => ({
      startsAt: booking.date,
      endsAt: addMinutes(booking.date, booking.service.durationMinutes),
    })),
    ...blocks.map((block) => ({
      startsAt: block.startsAt,
      endsAt: block.endsAt,
    })),
  ]
}

export const getServiceOpeningHours = async (input: unknown) => {
  const limit = await consumeRateLimit("readSchedule", await getClientIp())
  const parsed = serviceIdSchema.safeParse(input)
  if (!limit.allowed || !parsed.success) return []

  const service = await db.barbershopService.findFirst({
    where: {
      id: parsed.data,
      isActive: true,
      barbershop: { status: "ACTIVE" },
    },
    select: { barbershopId: true },
  })
  if (!service) return []

  const hours = await db.openingHour.findMany({
    where: { barbershopId: service.barbershopId },
    orderBy: { weekday: "asc" },
    select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
  })

  return withDefaults(hours)
}
