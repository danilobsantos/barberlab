import { timingSafeEqual } from "node:crypto"

export function isAuthorizedCronRequest(
  authorization: string | null,
  secret: string,
) {
  if (!secret || !authorization) return false
  const actual = Buffer.from(authorization)
  const expected = Buffer.from(`Bearer ${secret}`)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
