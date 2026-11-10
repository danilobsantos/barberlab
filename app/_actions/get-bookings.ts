"use server"

import { ProfessionalScheduleExceptionType } from "@prisma/client"
import { addMinutes } from "date-fns"
import { auth } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { withDefaults } from "../_lib/opening-hours"
import { consumeRateLimit, getClientIp } from "../_lib/rate-limit"
import {
  serviceIdSchema,
  unavailableIntervalsSchema,
} from "../_lib/booking-action-schema"
import {
  calculateAvailableSlots,
  effectiveScheduleException,
  localDayBounds,
  localDateTimeToInstant,
  OCCUPYING_BOOKING_STATUSES,
  weekdayForLocalDate,
} from "../_lib/booking-availability"

export const getServiceProfessionals = async (input: unknown) => {
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
  return db.professional
    .findMany({
      where: {
        barbershopId: service.barbershopId,
        status: "ACTIVE",
        services: {
          some: { serviceId: parsed.data, barbershopId: service.barbershopId },
        },
      },
      select: { id: true, displayName: true, name: true },
      orderBy: { name: "asc" },
    })
    .then((professionals) =>
      professionals.map(({ id, name, displayName }) => ({
        id,
        name: displayName || name,
      })),
    )
}

export const getUnavailableIntervals = async (
  input: unknown,
): Promise<string[]> => {
  const session = await auth()
  if (!session?.user) return []
  const parsed = unavailableIntervalsSchema.safeParse(input)
  if (!parsed.success) return []
  const { serviceId, professionalId, date } = parsed.data

  const limit = await consumeRateLimit("readSchedule", session.user.id)
  if (!limit.allowed) return []

  const service = await db.barbershopService.findFirst({
    where: {
      id: serviceId,
      isActive: true,
      barbershop: { status: "ACTIVE" },
      professionals: {
        some: { professionalId, professional: { status: "ACTIVE" } },
      },
    },
    select: {
      id: true,
      barbershopId: true,
      durationMinutes: true,
      barbershop: { select: { timezone: true } },
    },
  })
  if (!service) return []

  const weekday = weekdayForLocalDate(date)
  const { startsAt: dayStart, endsAt: dayEnd } = localDayBounds(
    date,
    service.barbershop.timezone,
  )
  const [professional, tenantHours, staffHours, exception, bookings, blocks] =
    await Promise.all([
      db.professional.findFirst({
        where: {
          id: professionalId,
          barbershopId: service.barbershopId,
          status: "ACTIVE",
          services: { some: { serviceId, barbershopId: service.barbershopId } },
        },
        select: { id: true },
      }),
      db.openingHour.findMany({
        where: { barbershopId: service.barbershopId },
        select: {
          weekday: true,
          opensAt: true,
          closesAt: true,
          isClosed: true,
        },
      }),
      db.professionalSchedule.findMany({
        where: { barbershopId: service.barbershopId, professionalId, weekday },
        select: { startsAtLocal: true, endsAtLocal: true },
      }),
      db.professionalScheduleException.findMany({
        where: {
          barbershopId: service.barbershopId,
          professionalId,
          date: new Date(`${date}T00:00:00.000Z`),
        },
        select: { type: true, startsAtLocal: true, endsAtLocal: true },
      }),
      db.booking.findMany({
        where: {
          status: { in: [...OCCUPYING_BOOKING_STATUSES] },
          service: { barbershopId: service.barbershopId },
          AND: [
            {
              OR: [
                { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
                {
                  OR: [{ startsAt: null }, { endsAt: null }],
                  date: { gte: dayStart, lt: dayEnd },
                },
              ],
            },
            { OR: [{ professionalId: null }, { professionalId }] },
          ],
        },
        select: {
          professionalId: true,
          date: true,
          startsAt: true,
          endsAt: true,
          durationMinutesSnapshot: true,
          service: { select: { durationMinutes: true } },
        },
      }),
      db.scheduleBlock.findMany({
        where: {
          barbershopId: service.barbershopId,
          OR: [{ professionalId: null }, { professionalId }],
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { startsAt: true, endsAt: true },
      }),
    ])
  if (!professional) return []
  const effectiveException = effectiveScheduleException(exception)

  const hours = withDefaults(tenantHours)
    .filter((item) => item.weekday === weekday && !item.isClosed)
    .map(({ opensAt, closesAt }) => ({ startsAt: opensAt, endsAt: closesAt }))
  const occupied = [
    ...bookings
      .filter(
        (booking) =>
          booking.professionalId === null ||
          booking.professionalId === professionalId,
      )
      .map((booking) => ({
        startsAt: booking.startsAt ?? booking.date,
        endsAt:
          booking.endsAt ??
          addMinutes(
            booking.startsAt ?? booking.date,
            booking.durationMinutesSnapshot ?? booking.service.durationMinutes,
          ),
      })),
    ...blocks,
  ]
  return calculateAvailableSlots({
    date,
    timeZone: service.barbershop.timezone,
    tenantHours: hours,
    professionalHours: staffHours.map(({ startsAtLocal, endsAtLocal }) => ({
      startsAt: startsAtLocal,
      endsAt: endsAtLocal,
    })),
    exception: effectiveException
      ? {
          type: effectiveException.type as ProfessionalScheduleExceptionType,
          startsAt: effectiveException.startsAtLocal,
          endsAt: effectiveException.endsAtLocal,
        }
      : undefined,
    durationMinutes: service.durationMinutes,
    occupied,
  }).filter((time) => {
    const instant = localDateTimeToInstant(
      date,
      time,
      service.barbershop.timezone,
    )
    return instant !== null && instant.getTime() > Date.now()
  })
}
