DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Subscription"
        WHERE "status" <> 'CANCELED'
        GROUP BY "barbershopId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce one current subscription per barbershop: duplicate non-canceled subscriptions exist';
    END IF;
END $$;

CREATE UNIQUE INDEX "Subscription_one_current_per_barbershop_key"
    ON "Subscription"("barbershopId")
    WHERE "status" <> 'CANCELED';
