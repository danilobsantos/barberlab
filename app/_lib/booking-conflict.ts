export const isBookingConflictError = (error: unknown) => {
  const candidate = error as {
    code?: unknown
    message?: unknown
    meta?: unknown
  } | null
  const details = `${candidate?.code ?? ""} ${JSON.stringify(candidate?.meta ?? {})} ${candidate?.message ?? error ?? ""}`
  return ["Booking_professional_no_overlap", "23P01", "40P01", "P2034"].some(
    (marker) => details.includes(marker),
  )
}
