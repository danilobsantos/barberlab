import { createHash, randomBytes } from "node:crypto"
import type { MembershipRole } from "@prisma/client"
import { z } from "zod"

export const MEMBERSHIP_INVITATION_DAYS = 7
export const isInvitationOwner = (role: MembershipRole) => role === "OWNER"
export const membershipInvitationExpiresAt = (now = new Date()) =>
  new Date(now.getTime() + MEMBERSHIP_INVITATION_DAYS * 24 * 60 * 60 * 1000)

export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

export const createInvitationToken = () => randomBytes(32).toString("base64url")

export const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export const normalizeInvitationEmail = (email: string) =>
  email.trim().toLowerCase()

export const isInvitationAcceptable = (
  invitation: {
    expiresAt: Date
    acceptedAt: Date | null
    canceledAt: Date | null
    email: string
  },
  email: string,
  now = new Date(),
) =>
  invitation.acceptedAt === null &&
  invitation.canceledAt === null &&
  invitation.expiresAt > now &&
  normalizeInvitationEmail(invitation.email) === normalizeInvitationEmail(email)
