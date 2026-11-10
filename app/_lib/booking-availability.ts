export const OCCUPYING_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const
export const isOccupyingBookingStatus = (status: string) =>
  (OCCUPYING_BOOKING_STATUSES as readonly string[]).includes(status)

export const effectiveScheduleException = <T extends { type: string }>(
  exceptions: T[],
) => exceptions.find(({ type }) => type === "UNAVAILABLE") ?? exceptions[0]

export interface LocalInterval {
  startsAt: string
  endsAt: string
}

export interface InstantInterval {
  startsAt: Date
  endsAt: Date
}

const formatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })

const partsAt = (instant: Date, timeZone: string) => {
  const parts = formatter(timeZone).formatToParts(instant)
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]))
}

export const localDateTimeToInstant = (
  date: string,
  time: string,
  timeZone: string,
): Date | null => {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  const target = Date.UTC(year, month - 1, day, hour, minute)
  const offsets = new Set<number>()
  for (let delta = -36; delta <= 36; delta += 6) {
    const instant = new Date(target + delta * 60 * 60 * 1000)
    const local = partsAt(instant, timeZone)
    const represented = Date.UTC(
      +local.year,
      +local.month - 1,
      +local.day,
      +local.hour,
      +local.minute,
      +local.second,
    )
    offsets.add(represented - instant.getTime())
  }

  const matches = [...offsets]
    .map((offset) => new Date(target - offset))
    .filter((instant) => {
      const local = partsAt(instant, timeZone)
      return (
        +local.year === year &&
        +local.month === month &&
        +local.day === day &&
        +local.hour === hour &&
        +local.minute === minute
      )
    })
    .sort((a, b) => a.getTime() - b.getTime())

  // Ambiguous fall-back times resolve to the earlier occurrence; nonexistent spring-forward times are unavailable.
  return matches[0] ?? null
}

export const localDayBounds = (date: string, timeZone: string) => {
  const [year, month, day] = date.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  const nextDate = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`
  const firstValidInstant = (day: string) => {
    for (let minute = 0; minute < 24 * 60; minute += 1) {
      const instant = localDateTimeToInstant(
        day,
        `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
        timeZone,
      )
      if (instant) return instant
    }
    return null
  }
  const startsAt = firstValidInstant(date)
  const endsAt = firstValidInstant(nextDate)
  if (!startsAt || !endsAt)
    throw new RangeError("Invalid local date or timezone")
  return { startsAt, endsAt }
}

export const weekdayForLocalDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).getUTCDay()

export const intervalOverlaps = (a: InstantInterval, b: InstantInterval) =>
  a.startsAt < b.endsAt && a.endsAt > b.startsAt

export const calculateAvailableSlots = ({
  date,
  timeZone,
  tenantHours,
  professionalHours,
  exception,
  durationMinutes,
  occupied,
}: {
  date: string
  timeZone: string
  tenantHours: LocalInterval[]
  professionalHours: LocalInterval[]
  exception?: {
    type: "UNAVAILABLE" | "CUSTOM_HOURS"
    startsAt: string | null
    endsAt: string | null
  }
  durationMinutes: number
  occupied: InstantInterval[]
}) => {
  if (exception?.type === "UNAVAILABLE") return []
  const staffHours =
    exception?.type === "CUSTOM_HOURS"
      ? exception.startsAt && exception.endsAt
        ? [{ startsAt: exception.startsAt, endsAt: exception.endsAt }]
        : []
      : professionalHours
  const slots: string[] = []
  for (const tenant of tenantHours) {
    for (const staff of staffHours) {
      const starts = Math.max(
        ...[tenant.startsAt, staff.startsAt].map((value) => {
          const [h, m] = value.split(":").map(Number)
          return h * 60 + m
        }),
      )
      const ends = Math.min(
        ...[tenant.endsAt, staff.endsAt].map((value) => {
          const [h, m] = value.split(":").map(Number)
          return h * 60 + m
        }),
      )
      for (
        let minute = starts;
        minute + durationMinutes <= ends;
        minute += 30
      ) {
        const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
        const startsAt = localDateTimeToInstant(date, time, timeZone)
        if (!startsAt) continue
        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000)
        if (
          !occupied.some((interval) =>
            intervalOverlaps({ startsAt, endsAt }, interval),
          )
        )
          slots.push(time)
      }
    }
  }
  return [...new Set(slots)].sort()
}
