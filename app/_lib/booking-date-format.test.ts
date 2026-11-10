import assert from "node:assert/strict"
import test from "node:test"
import { formatBookingDateTime } from "./booking-date-format"
import { buildCustomerConfirmationMessage } from "./whatsapp"

test("formats a booking instant in the barbershop timezone across customer timezones", () => {
  const booking = new Date("2026-01-05T02:30:00.000Z")
  assert.deepEqual(formatBookingDateTime(booking, "America/Sao_Paulo"), {
    day: "4",
    month: "janeiro",
    weekday: "domingo",
    time: "23:30",
    dateLabel: "4 de janeiro",
  })
  assert.deepEqual(formatBookingDateTime(booking, "Asia/Tokyo"), {
    day: "5",
    month: "janeiro",
    weekday: "segunda-feira",
    time: "11:30",
    dateLabel: "5 de janeiro",
  })
})

test("customer WhatsApp confirmation uses the tenant timezone", () => {
  const message = buildCustomerConfirmationMessage({
    serviceName: "Corte",
    date: new Date("2026-01-05T02:30:00.000Z"),
    timeZone: "America/Sao_Paulo",
    barbershopName: "Barbearia",
  })
  assert.match(message, /\*Data:\* 04\/01\/2026 \(domingo\)/)
  assert.match(message, /\*Horário:\* 23:30/)
})
