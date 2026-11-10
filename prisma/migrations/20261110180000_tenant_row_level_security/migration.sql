CREATE FUNCTION app_context_tenant_id() RETURNS TEXT
LANGUAGE SQL STABLE
AS $$ SELECT NULLIF(current_setting('app.tenant_id', true), '') $$;

CREATE FUNCTION app_context_platform_admin() RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$ SELECT COALESCE(current_setting('app.platform_admin', true) = 'true', false) $$;

DO $$
DECLARE
  table_name TEXT;
  tenant_expression TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'OpeningHour', 'Membership', 'BarbershopService', 'Professional',
    'Customer', 'ProfessionalService', 'ProfessionalSchedule',
    'ProfessionalScheduleException', 'Booking', 'Subscription', 'ScheduleBlock'
  ] LOOP
    tenant_expression := format(
      '"barbershopId" = app_context_tenant_id() OR app_context_platform_admin()'
    );
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (%s) WITH CHECK (%s)',
      table_name, tenant_expression, tenant_expression
    );
  END LOOP;
END $$;

ALTER TABLE "Barbershop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Barbershop" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Barbershop"
USING ("id" = app_context_tenant_id() OR app_context_platform_admin())
WITH CHECK ("id" = app_context_tenant_id() OR app_context_platform_admin());

ALTER TABLE "ProfessionalInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProfessionalInvitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ProfessionalInvitation"
USING (
  app_context_platform_admin() OR EXISTS (
    SELECT 1 FROM "Professional" p
    WHERE p."id" = "ProfessionalInvitation"."professionalId"
      AND p."barbershopId" = app_context_tenant_id()
  )
)
WITH CHECK (
  app_context_platform_admin() OR EXISTS (
    SELECT 1 FROM "Professional" p
    WHERE p."id" = "ProfessionalInvitation"."professionalId"
      AND p."barbershopId" = app_context_tenant_id()
  )
);

ALTER TABLE "SubscriptionEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriptionEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "SubscriptionEvent"
USING (
  app_context_platform_admin() OR "barbershopId" = app_context_tenant_id()
)
WITH CHECK (
  app_context_platform_admin() OR "barbershopId" = app_context_tenant_id()
);

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AuditLog"
USING (
  app_context_platform_admin() OR "barbershopId" = app_context_tenant_id()
)
WITH CHECK (
  app_context_platform_admin() OR "barbershopId" = app_context_tenant_id()
);
