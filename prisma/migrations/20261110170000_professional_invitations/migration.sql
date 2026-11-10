CREATE TABLE "ProfessionalInvitation" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6),
    "canceledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProfessionalInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfessionalInvitation_professionalId_key"
ON "ProfessionalInvitation"("professionalId");

CREATE UNIQUE INDEX "ProfessionalInvitation_tokenHash_key"
ON "ProfessionalInvitation"("tokenHash");

CREATE INDEX "ProfessionalInvitation_expiresAt_idx"
ON "ProfessionalInvitation"("expiresAt");

ALTER TABLE "ProfessionalInvitation"
ADD CONSTRAINT "ProfessionalInvitation_professionalId_fkey"
FOREIGN KEY ("professionalId") REFERENCES "Professional"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
