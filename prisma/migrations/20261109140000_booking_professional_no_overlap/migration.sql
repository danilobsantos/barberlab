CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Booking" a
        JOIN "Booking" b
          ON a."id" < b."id"
         AND a."professionalId" = b."professionalId"
         AND tstzrange(a."startsAt", a."endsAt", '[)') && tstzrange(b."startsAt", b."endsAt", '[)')
        WHERE a."professionalId" IS NOT NULL
          AND a."startsAt" IS NOT NULL
          AND a."endsAt" IS NOT NULL
          AND b."startsAt" IS NOT NULL
          AND b."endsAt" IS NOT NULL
          AND a."status" IN ('PENDING', 'CONFIRMED')
          AND b."status" IN ('PENDING', 'CONFIRMED')
    ) THEN
        RAISE EXCEPTION 'Cannot add booking overlap constraint: resolve existing overlapping PENDING/CONFIRMED professional bookings first';
    END IF;
END $$;

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_professional_no_overlap"
    EXCLUDE USING gist (
        "professionalId" WITH =,
        tstzrange("startsAt", "endsAt", '[)') WITH &&
    )
    WHERE (
        "professionalId" IS NOT NULL
        AND "startsAt" IS NOT NULL
        AND "endsAt" IS NOT NULL
        AND "status" IN ('PENDING', 'CONFIRMED')
    );
