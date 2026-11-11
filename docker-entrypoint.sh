#!/bin/sh
set -e

echo "==> Aguardando banco de dados e aplicando migrações (Prisma migrate deploy)..."
if [ -z "${MIGRATION_DATABASE_URL:-}" ]; then
  echo "MIGRATION_DATABASE_URL must use a separate schema-owner credential." >&2
  exit 1
fi
pnpm exec prisma migrate deploy

echo "==> Verificando e populando banco de dados com seed..."
pnpm exec prisma db seed

echo "==> Iniciando aplicação BarberLab..."
exec "$@"
