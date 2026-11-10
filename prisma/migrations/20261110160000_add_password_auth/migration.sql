CREATE TYPE "AccountType" AS ENUM ('CUSTOMER', 'BARBERSHOP');

ALTER TABLE "User"
    ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'CUSTOMER',
    ADD COLUMN "passwordHash" TEXT,
    ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;

UPDATE "User"
SET "accountType" = 'BARBERSHOP'
WHERE "role" = 'BARBER_ADMIN'
   OR EXISTS (
       SELECT 1 FROM "Membership"
       WHERE "Membership"."userId" = "User"."id"
   );
