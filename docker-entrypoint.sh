#!/bin/sh
set -e

echo "==> Aguardando banco de dados e aplicando migrações (Prisma migrate deploy)..."
pnpm exec prisma migrate deploy

echo "==> Verificando e populando banco de dados com seed..."
pnpm exec prisma db seed

echo "==> Iniciando aplicação BarberLab..."
exec "$@"
