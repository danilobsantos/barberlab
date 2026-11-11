ALTER TABLE "ProfessionalInvitation" ADD COLUMN "barbershopId" TEXT;

UPDATE "ProfessionalInvitation" i
SET "barbershopId" = p."barbershopId"
FROM "Professional" p
WHERE p."id" = i."professionalId";

ALTER TABLE "ProfessionalInvitation"
  ALTER COLUMN "barbershopId" SET NOT NULL,
  ADD CONSTRAINT "ProfessionalInvitation_barbershopId_fkey"
    FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ProfessionalInvitation_barbershopId_idx"
  ON "ProfessionalInvitation"("barbershopId");

DROP POLICY tenant_isolation ON "ProfessionalInvitation";
CREATE POLICY tenant_isolation ON "ProfessionalInvitation"
USING (
  "barbershopId" = app_context_tenant_id() OR app_context_platform_admin()
)
WITH CHECK (
  "barbershopId" = app_context_tenant_id() OR app_context_platform_admin()
);

DROP POLICY professional_invitation_lookup ON "Professional";
DROP POLICY barbershop_invitation_lookup ON "Barbershop";
