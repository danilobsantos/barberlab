CREATE TYPE "BarbershopStatus" AS ENUM ('PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MANAGER', 'PROFESSIONAL');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE "PlatformRole" AS ENUM ('NONE', 'SUPER_ADMIN');
CREATE TYPE "ProfessionalStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED');

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PENDING';

ALTER TABLE "Barbershop"
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    ADD COLUMN "status" "BarbershopStatus" NOT NULL DEFAULT 'PENDING_SETUP';

UPDATE "Barbershop"
SET "slug" = COALESCE(
    NULLIF(trim(both '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')), ''),
    'barbershop'
) || '-' || "id";

ALTER TABLE "Barbershop" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Barbershop_slug_key" ON "Barbershop"("slug");

ALTER TABLE "User"
    ADD COLUMN "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE';

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Membership_userId_barbershopId_key" ON "Membership"("userId", "barbershopId");
CREATE INDEX "Membership_barbershopId_idx" ON "Membership"("barbershopId");
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_barbershopId_fkey"
    FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "ProfessionalScheduleExceptionType" AS ENUM ('UNAVAILABLE', 'CUSTOM_HOURS');

CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "imageUrl" TEXT,
    "calendarColor" TEXT,
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Professional_barbershopId_id_key" UNIQUE ("barbershopId", "id"),
    CONSTRAINT "Professional_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Professional_userId_barbershopId_fkey" FOREIGN KEY ("userId", "barbershopId") REFERENCES "Membership"("userId", "barbershopId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Professional_barbershopId_status_idx" ON "Professional"("barbershopId", "status");
CREATE INDEX "Professional_userId_idx" ON "Professional"("userId");

CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Customer_barbershopId_id_key" UNIQUE ("barbershopId", "id"),
    CONSTRAINT "Customer_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Customer_barbershopId_idx" ON "Customer"("barbershopId");
CREATE INDEX "Customer_barbershopId_phone_idx" ON "Customer"("barbershopId", "phone");
CREATE INDEX "Customer_barbershopId_email_idx" ON "Customer"("barbershopId", "email");
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

ALTER TABLE "BarbershopService" ADD CONSTRAINT "BarbershopService_barbershopId_id_key" UNIQUE ("barbershopId", "id");

CREATE TABLE "ProfessionalService" (
    "barbershopId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfessionalService_pkey" PRIMARY KEY ("professionalId", "serviceId"),
    CONSTRAINT "ProfessionalService_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalService_professional_fkey" FOREIGN KEY ("barbershopId", "professionalId") REFERENCES "Professional"("barbershopId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalService_service_fkey" FOREIGN KEY ("barbershopId", "serviceId") REFERENCES "BarbershopService"("barbershopId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProfessionalService_barbershopId_idx" ON "ProfessionalService"("barbershopId");

CREATE TABLE "ProfessionalSchedule" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startsAtLocal" TEXT NOT NULL,
    "endsAtLocal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalSchedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProfessionalSchedule_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalSchedule_professional_fkey" FOREIGN KEY ("barbershopId", "professionalId") REFERENCES "Professional"("barbershopId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProfessionalSchedule_barbershopId_professionalId_weekday_idx" ON "ProfessionalSchedule"("barbershopId", "professionalId", "weekday");

CREATE TABLE "ProfessionalScheduleException" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ProfessionalScheduleExceptionType" NOT NULL,
    "startsAtLocal" TEXT,
    "endsAtLocal" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalScheduleException_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProfessionalScheduleException_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalScheduleException_professional_fkey" FOREIGN KEY ("barbershopId", "professionalId") REFERENCES "Professional"("barbershopId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProfessionalScheduleException_barbershopId_professionalId_date_idx" ON "ProfessionalScheduleException"("barbershopId", "professionalId", "date");

ALTER TABLE "Booking"
    ADD COLUMN "barbershopId" TEXT,
    ADD COLUMN "customerId" TEXT,
    ADD COLUMN "professionalId" TEXT,
    ADD COLUMN "startsAt" TIMESTAMP(3),
    ADD COLUMN "endsAt" TIMESTAMP(3),
    ADD COLUMN "priceSnapshot" DECIMAL(10,2),
    ADD COLUMN "durationMinutesSnapshot" INTEGER,
    ADD COLUMN "customerNameSnapshot" TEXT,
    ADD COLUMN "customerPhoneSnapshot" TEXT,
    ADD COLUMN "notes" TEXT,
    ADD CONSTRAINT "Booking_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Booking_customer_fkey" FOREIGN KEY ("barbershopId", "customerId") REFERENCES "Customer"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "Booking_professional_fkey" FOREIGN KEY ("barbershopId", "professionalId") REFERENCES "Professional"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Booking_barbershopId_startsAt_idx" ON "Booking"("barbershopId", "startsAt");
CREATE INDEX "Booking_professionalId_startsAt_idx" ON "Booking"("professionalId", "startsAt");

ALTER TABLE "ScheduleBlock" ADD COLUMN "professionalId" TEXT;
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_professional_fkey"
    FOREIGN KEY ("barbershopId", "professionalId") REFERENCES "Professional"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_tenant_professional_service_key"
    UNIQUE ("barbershopId", "professionalId", "serviceId");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_service_tenant_fkey"
    FOREIGN KEY ("barbershopId", "serviceId") REFERENCES "BarbershopService"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_professionalService_tenant_fkey"
    FOREIGN KEY ("barbershopId", "professionalId", "serviceId")
    REFERENCES "ProfessionalService"("barbershopId", "professionalId", "serviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_complete_tenant_assignment_check"
    CHECK ("barbershopId" IS NULL OR ("customerId" IS NOT NULL AND "professionalId" IS NOT NULL AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL));
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_time_order_check"
    CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" < "endsAt");
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_time_order_check" CHECK ("startsAt" < "endsAt");
ALTER TABLE "ProfessionalSchedule" ADD CONSTRAINT "ProfessionalSchedule_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6);
ALTER TABLE "ProfessionalSchedule" ADD CONSTRAINT "ProfessionalSchedule_time_order_check" CHECK ("startsAtLocal" < "endsAtLocal");
ALTER TABLE "ProfessionalScheduleException" ADD CONSTRAINT "ProfessionalScheduleException_hours_check"
    CHECK (("type" = 'UNAVAILABLE' AND "startsAtLocal" IS NULL AND "endsAtLocal" IS NULL)
        OR ("type" = 'CUSTOM_HOURS' AND "startsAtLocal" IS NOT NULL AND "endsAtLocal" IS NOT NULL AND "startsAtLocal" < "endsAtLocal"));

CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "maxProfessionals" INTEGER,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "priceAtSubscription" DECIMAL(10,2) NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),
    "externalCustomerId" TEXT,
    "externalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Subscription_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_period_order_check" CHECK ("currentPeriodStart" < "currentPeriodEnd")
);
CREATE INDEX "Subscription_barbershopId_status_idx" ON "Subscription"("barbershopId", "status");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_externalSubscriptionId_idx" ON "Subscription"("externalSubscriptionId");
CREATE UNIQUE INDEX "Subscription_one_current_per_barbershop_key"
    ON "Subscription"("barbershopId") WHERE "status" IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED');

CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "barbershopId" TEXT,
    "subscriptionId" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubscriptionEvent_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SubscriptionEvent_provider_externalEventId_key" ON "SubscriptionEvent"("provider", "externalEventId");
CREATE INDEX "SubscriptionEvent_barbershopId_receivedAt_idx" ON "SubscriptionEvent"("barbershopId", "receivedAt");
CREATE INDEX "SubscriptionEvent_subscriptionId_idx" ON "SubscriptionEvent"("subscriptionId");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_barbershopId_createdAt_idx" ON "AuditLog"("barbershopId", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
