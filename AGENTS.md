# BarberLab

## Desenvolvimento e verificação
- Use pnpm; o Dockerfile fixa pnpm 9. Comandos: `pnpm dev`, `pnpm lint` e `pnpm build`.
- Não há scripts de teste ou typecheck no `package.json`. Para verificar tipos: `pnpm exec tsc --noEmit`.
- `pnpm install` executa `prepare`, que chama Husky e `prisma generate`.
- O pre-commit executa `lint-staged`, que aplica `eslint --fix` aos arquivos JS/TS staged.

## Banco e ambiente
- `docker compose up -d db` inicia PostgreSQL 16 na porta 5432; o Compose não inicia a aplicação.
- Use `.env.example` como referência para configuração local. O segredo do NextAuth é `NEXT_AUTH_SECRET`.
- `prisma.config.ts` carrega `.env` antes de `.env.local` sem sobrescrever variáveis já definidas; valores de `.env` prevalecem sobre os mesmos valores em `.env.local` para comandos Prisma.
- O entrypoint Docker executa `prisma migrate deploy` e `prisma db seed` em toda inicialização. O seed pula a população se já existir alguma barbearia; confira o banco de destino antes de executá-lo.

## Arquitetura e cuidados
- O código atual ainda usa marketplace e `User.barbershopId` para vínculo único. `BarberLab_SaaS_v1_1.md` descreve a arquitetura multitenant pretendida, não necessariamente implementada.
- Ainda não há produção nem dados que precisem ser preservados, conforme informado pelo proprietário. Confirme o banco de destino antes de operações destrutivas.
- `proxy.ts` redireciona `/barbershops` e suas sub-rotas quando `SINGLE_BARBERSHOP_ID` está definido.
- O rate limiting usa PostgreSQL (`RateLimit`), com fallback em memória por processo; falhas inesperadas permitem a requisição. Não pressupor Redis.
