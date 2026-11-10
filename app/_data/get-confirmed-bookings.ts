"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { consumeRateLimit } from "../_lib/rate-limit"
import { BookingStatus } from "@prisma/client"

export const getConfirmedBookings = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return []
  }
  const limit = await consumeRateLimit("readOwnBookings", session.user.id)
  if (!limit.allowed) return []
  const bookings = await db.booking.findMany({
    where: {
      userId: session.user.id,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      date: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      date: true,
      status: true,
      service: {
        select: {
          name: true,
          price: true,
          barbershop: {
            select: {
              name: true,
              address: true,
              imageUrl: true,
              phones: true,
              timezone: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return bookings.map(toBookingItem)
}

const toBookingItem = (booking: {
  id: string
  date: Date
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW"
  service: {
    name: string
    price: unknown
    barbershop: {
      name: string
      address: string
      imageUrl: string
      phones: string[]
      timezone: string
    }
  }
}) => ({
  id: booking.id,
  date: booking.date,
  status: booking.status,
  service: {
    name: booking.service.name,
    price: Number(booking.service.price),
    barbershop: booking.service.barbershop,
  },
})
