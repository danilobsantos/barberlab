\prompt 'Runtime database password: ' runtime_password
\prompt 'Migration role that owns Prisma-created objects: ' migration_role

SELECT format('CREATE ROLE barberlab_runtime LOGIN PASSWORD %L', :'runtime_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'barberlab_runtime')
\gexec

SELECT format('ALTER ROLE barberlab_runtime LOGIN PASSWORD %L', :'runtime_password')
\gexec

ALTER ROLE barberlab_runtime NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
SELECT format('GRANT CONNECT ON DATABASE %I TO barberlab_runtime', current_database())
\gexec
GRANT USAGE ON SCHEMA public TO barberlab_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "User", "Account", "Session", "VerificationToken", "OpeningHour", "Barbershop",
  "Membership", "BarbershopService", "Professional", "ProfessionalInvitation",
  "Customer", "ProfessionalService", "ProfessionalSchedule",
  "ProfessionalScheduleException", "Booking", "Plan", "Subscription",
  "SubscriptionEvent", "AuditLog", "ScheduleBlock", "RateLimit"
TO barberlab_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO barberlab_runtime;

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO barberlab_runtime',
  :'migration_role'
)
\gexec
SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO barberlab_runtime',
  :'migration_role'
)
\gexec

\echo 'barberlab_runtime provisioned. Verify it is not a superuser or BYPASSRLS role.'
