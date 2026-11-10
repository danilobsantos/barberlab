export const formatBookingDateTime = (date: Date, timeZone: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      day: "numeric",
      month: "long",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  )

  return {
    day: parts.day,
    month: parts.month,
    weekday: parts.weekday,
    time: `${parts.hour}:${parts.minute}`,
    dateLabel: `${parts.day} de ${parts.month}`,
  }
}
