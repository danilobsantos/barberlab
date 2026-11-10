import assert from "node:assert/strict"
import test from "node:test"
import {
  createInvitationToken,
  hashInvitationToken,
  isInvitationOwner,
  isInvitationAcceptable,
  membershipInvitationExpiresAt,
} from "./membership-invitation"

test("invitation tokens are random, URL-safe, and stored as hashes", () => {
  const token = createInvitationToken()
  assert.match(token, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(hashInvitationToken(token).length, 64)
  assert.notEqual(hashInvitationToken(token), token)
  assert.notEqual(
    hashInvitationToken(token),
    hashInvitationToken(createInvitationToken()),
  )
})

test("each invitation issue or resend gets a seven-day expiration", () => {
  const issuedAt = new Date("2026-11-10T12:00:00.000Z")
  assert.equal(
    membershipInvitationExpiresAt(issuedAt).toISOString(),
    "2026-11-17T12:00:00.000Z",
  )
})

test("only owners can manage professional invitations", () => {
  assert.equal(isInvitationOwner("OWNER"), true)
  assert.equal(isInvitationOwner("MANAGER"), false)
  assert.equal(isInvitationOwner("PROFESSIONAL"), false)
})

test("invitation acceptance requires the exact verified email and a live token", () => {
  const now = new Date("2026-11-10T12:00:00.000Z")
  const invitation = {
    email: " Staff@Example.com ",
    expiresAt: new Date("2026-11-17T12:00:00.000Z"),
    acceptedAt: null,
    canceledAt: null,
  }

  assert.equal(
    isInvitationAcceptable(invitation, "staff@example.com", now),
    true,
  )
  assert.equal(
    isInvitationAcceptable(invitation, "other@example.com", now),
    false,
  )
  assert.equal(
    isInvitationAcceptable(
      { ...invitation, expiresAt: now },
      "staff@example.com",
      now,
    ),
    false,
  )
  assert.equal(
    isInvitationAcceptable(
      { ...invitation, acceptedAt: now },
      "staff@example.com",
      now,
    ),
    false,
  )
  assert.equal(
    isInvitationAcceptable(
      { ...invitation, canceledAt: now },
      "staff@example.com",
      now,
    ),
    false,
  )
})
