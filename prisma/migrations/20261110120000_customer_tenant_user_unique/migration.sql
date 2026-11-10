DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Customer"
        WHERE "userId" IS NOT NULL
        GROUP BY "barbershopId", "userId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add Customer tenant/user uniqueness: duplicate non-null (barbershopId, userId) pairs exist';
    END IF;
END $$;

CREATE UNIQUE INDEX "Customer_barbershopId_userId_key"
    ON "Customer"("barbershopId", "userId");
