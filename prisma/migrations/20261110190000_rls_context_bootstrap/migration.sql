CREATE FUNCTION app_context_tenant_slug() RETURNS TEXT
LANGUAGE SQL STABLE
AS $$ SELECT NULLIF(current_setting('app.tenant_slug', true), '') $$;

CREATE FUNCTION app_context_invitation_token_hash() RETURNS TEXT
LANGUAGE SQL STABLE
AS $$ SELECT NULLIF(current_setting('app.invitation_token_hash', true), '') $$;

CREATE POLICY membership_self_read ON "Membership"
FOR SELECT
USING ("userId" = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY barbershop_membership_lookup ON "Barbershop"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Membership" m
    WHERE m."barbershopId" = "Barbershop"."id"
      AND m."userId" = NULLIF(current_setting('app.user_id', true), '')
      AND m."status" = 'ACTIVE'
  )
);

CREATE POLICY customer_self_read ON "Customer"
FOR SELECT
USING ("userId" = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY booking_self_read ON "Booking"
FOR SELECT
USING ("userId" = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY booking_self_update ON "Booking"
FOR UPDATE
USING ("userId" = NULLIF(current_setting('app.user_id', true), ''))
WITH CHECK ("userId" = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY barbershop_slug_lookup ON "Barbershop"
FOR SELECT
USING (
  "slug" = app_context_tenant_slug()
  AND "status" IN ('ACTIVE', 'PENDING_SETUP')
);

CREATE POLICY barbershop_booking_lookup ON "Barbershop"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Booking" b
    WHERE b."barbershopId" = "Barbershop"."id"
      AND b."userId" = NULLIF(current_setting('app.user_id', true), '')
  )
);

CREATE POLICY service_booking_lookup ON "BarbershopService"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Booking" b
    WHERE b."serviceId" = "BarbershopService"."id"
      AND b."userId" = NULLIF(current_setting('app.user_id', true), '')
  )
);

CREATE POLICY invitation_token_lookup ON "ProfessionalInvitation"
FOR SELECT
USING (
  "tokenHash" = app_context_invitation_token_hash()
  AND "acceptedAt" IS NULL
  AND "canceledAt" IS NULL
  AND "expiresAt" > CURRENT_TIMESTAMP
);

CREATE POLICY professional_invitation_lookup ON "Professional"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "ProfessionalInvitation" i
    WHERE i."professionalId" = "Professional"."id"
      AND i."tokenHash" = app_context_invitation_token_hash()
      AND i."acceptedAt" IS NULL
      AND i."canceledAt" IS NULL
      AND i."expiresAt" > CURRENT_TIMESTAMP
  )
);

CREATE POLICY barbershop_invitation_lookup ON "Barbershop"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "Professional" p
    JOIN "ProfessionalInvitation" i ON i."professionalId" = p."id"
    WHERE p."barbershopId" = "Barbershop"."id"
      AND i."tokenHash" = app_context_invitation_token_hash()
      AND i."acceptedAt" IS NULL
      AND i."canceledAt" IS NULL
      AND i."expiresAt" > CURRENT_TIMESTAMP
  )
);
