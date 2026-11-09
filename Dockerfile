FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV HUSKY=0
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barberlab?sslmode=disable"
ENV NEXT_AUTH_SECRET="build_secret_min_32_characters_for_deployment_123"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN pnpm exec prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["pnpm", "start"]
