# Graph Report - BarberLab  (2026-11-09)

## Corpus Check
- 167 files · ~238,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 801 nodes · 1911 edges · 54 communities (41 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e4d7ab71`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- barbershop-schema.ts
- button.tsx
- create-booking.ts
- (admin)/schedule/page.tsx
- package.json
- onboarding-tour.tsx
- dependencies
- 6. Modelo de dados alvo
- devDependencies
- app/layout.tsx
- compilerOptions
- components.json
- Desktop
- consumeRateLimit
- auth.ts
- user-menu.tsx
- prisma.ts
- BarberLab SaaS — Arquitetura Técnica e Plano de Implementação
- 11. Plano de implementação por fases e prioridade
- cn
- 7. Regras de acesso e segurança multitenant
- scripts
- page-skeleton.tsx
- require-admin-context.ts
- apple-icon.tsx
- 13. Estratégia de testes e critérios globais de aceite
- 8. Fluxos funcionais
- extends
- BarberLab
- 19. Redis e processamento assíncrono — evolução futura (fora do MVP)
- 3. Avaliação do projeto atual
- 5. Rotas e experiência de navegação
- 9. Regras detalhadas do agendamento
- next.config.mjs
- overrides
- BarberLab
- 10. Planos comerciais
- 14. Migração e publicação em produção
- rate-limit.ts
- 1. Objetivo e visão do produto
- eslint.config.mjs
- postcss.config.mjs
- proxy.ts
- docker-entrypoint.sh
- commit-msg
- lint-staged
- prisma
- catalog-home.tsx
- global-error.tsx
- barbershop-registration-schema.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 66 edges
2. `lucide-react` - 44 edges
3. `Button` - 41 edges
4. `react` - 36 edges
5. `db` - 32 edges
6. `consumeRateLimit()` - 30 edges
7. `requireAdminContext()` - 29 edges
8. `auth()` - 26 edges
9. `CardContent` - 22 edges
10. `rateLimitError()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `MyBarbershopsPage()` --calls--> `auth()`  [EXTRACTED]
  app/minhas-barbearias/page.tsx → app/_lib/auth.ts
- `BarbershopProfileForm()` --calls--> `saveBarbershopProfile()`  [EXTRACTED]
  app/(admin)/_components/barbershop-profile-form.tsx → app/(admin)/_actions/barbershop.ts
- `completeOnboarding()` --calls--> `requireAdminContext()`  [EXTRACTED]
  app/(admin)/_actions/onboarding.ts → app/_lib/tenant/require-admin-context.ts
- `OpeningHoursForm()` --calls--> `saveOpeningHours()`  [EXTRACTED]
  app/(admin)/_components/opening-hours-form.tsx → app/(admin)/_actions/opening-hours.ts
- `BlockManager()` --calls--> `createScheduleBlock()`  [EXTRACTED]
  app/(admin)/_components/block-manager.tsx → app/(admin)/_actions/schedule-blocks.ts

## Import Cycles
- None detected.

## Communities (54 total, 9 thin omitted)

### Community 0 - "barbershop-schema.ts"
Cohesion: 0.29
Nodes (6): BarbershopProfileFormProps, BarbershopProfileInput, barbershopProfileSchema, CustomerProfileInput, customerProfileSchema, phone

### Community 1 - "button.tsx"
Cohesion: 0.06
Nodes (45): ErrorProps, AdminPanelLink(), BarbershopItem(), BarbershopItemProps, filterSearchableElements(), Header(), HeaderProps, PhoneItemProps (+37 more)

### Community 2 - "create-booking.ts"
Cohesion: 0.15
Nodes (20): createBooking(), overlaps(), getServiceOpeningHours(), getUnavailableIntervals(), BarbershopProfileForm(), metadata, Settings(), getTimeList() (+12 more)

### Community 3 - "(admin)/schedule/page.tsx"
Cohesion: 0.08
Nodes (44): BlockManager(), BookingRow(), BookingRowProps, DayNavigator(), DayNavigatorProps, EmptyState(), EmptyStateProps, PageHeader() (+36 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (36): name, private, version, @auth/prisma-adapter, @bprogress/next, clsx, eslint, eslint-config-prettier (+28 more)

### Community 5 - "onboarding-tour.tsx"
Cohesion: 0.38
Nodes (6): completeOnboarding(), elementoVisivel(), OnboardingTour(), Passo, PASSOS, driver.js

### Community 6 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @auth/prisma-adapter, @bprogress/next, class-variance-authority, clsx, date-fns, driver.js, @hookform/resolvers (+22 more)

### Community 7 - "6. Modelo de dados alvo"
Cohesion: 0.07
Nodes (28): 6.1. Identidade e autenticação, 6.2. Tenant e perfil da barbearia, 6.3. Profissionais e equipe, 6.4. Clientes isolados por tenant, 6.5. Serviços, 6.6. Horários e disponibilidade, 6.7. Agendamentos, 6.8. Planos e assinaturas (+20 more)

### Community 8 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-next, eslint-config-prettier, @eslint/eslintrc, @eslint/js, @eslint/migrate-config, eslint-plugin-prettier (+17 more)

### Community 9 - "app/layout.tsx"
Cohesion: 0.16
Nodes (10): DemoBanner(), Providers(), Toaster(), ToasterProps, inter, metadata, viewport, isDemo (+2 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 13 - "Desktop"
Cohesion: 0.12
Nodes (15): Agendamentos, Agendamentos, Barbearia e Serviços, Barbearia e Serviços, Barbearias, Barbearias, 🧱 BarberLab, 📸 Demonstrações (+7 more)

### Community 14 - "consumeRateLimit"
Cohesion: 0.19
Nodes (20): saveBarbershopProfile(), saveOpeningHours(), buildDate(), createScheduleBlock(), createSchema, deleteScheduleBlock(), timeSchema, deleteService() (+12 more)

### Community 15 - "auth.ts"
Cohesion: 0.17
Nodes (13): deleteBooking(), registerBarbershop(), RegistrationState, schema, updateOwnPhone(), TenantAdminLayout(), CadastroPage(), RegistrationForm() (+5 more)

### Community 16 - "user-menu.tsx"
Cohesion: 0.12
Nodes (18): getAdminNavItems(), NAV_ITEMS, AdminSidebar(), AdminSidebarProps, AdminTabBar(), AdminTopbar(), AdminTopbarProps, Avatar (+10 more)

### Community 17 - "prisma.ts"
Cohesion: 0.19
Nodes (7): schema, findPlatformAdmin(), PlatformAdminStore, db, main(), seedDatabase(), @prisma/client

### Community 18 - "BarberLab SaaS — Arquitetura Técnica e Plano de Implementação"
Cohesion: 0.15
Nodes (12): 12. Dependências e caminho crítico, 15. Configuração de ambiente e deploy, 16. Estimativa de esforço, 17. Decisões ainda pendentes antes do desenvolvimento de cada módulo, 18. Recomendação final e ordem imediata de execução, 20. Referências do projeto, 2.1. Interpretação da decisão sobre clientes isolados, 2.2. Decisão sobre URLs (+4 more)

### Community 19 - "11. Plano de implementação por fases e prioridade"
Cohesion: 0.20
Nodes (10): 11. Plano de implementação por fases e prioridade, Fase 0 — Preparação, inventário e baseline, Fase 1 — Fundação multitenant e schema, Fase 2 — Backfill e migração de dados, Fase 3 — Autenticação, tenant context e autorização, Fase 4 — Cadastro e gestão de profissionais, Fase 5 — Motor de agendamento multi-profissional, Fase 6 — Perfil público, clientes e remoção do marketplace (+2 more)

### Community 20 - "cn"
Cohesion: 0.06
Nodes (81): UnavailableInterval, BlockManagerProps, PRESETS, OpeningHoursForm(), OpeningHoursFormProps, DURATION_OPTIONS, EMPTY, ServiceFormDialog() (+73 more)

### Community 21 - "7. Regras de acesso e segurança multitenant"
Cohesion: 0.25
Nodes (8): 7.1. Papéis e permissões, 7.2. Contexto do tenant, 7.3. Padrão de consulta, 7.4. PostgreSQL Row-Level Security (RLS), 7.5. Proteção de arquivos, 7.6. Rate limiting e cache no MVP, 7.7. Proteções adicionais, 7. Regras de acesso e segurança multitenant

### Community 22 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, analyze, build, dev, lint, lint:fix, prepare, start (+1 more)

### Community 24 - "require-admin-context.ts"
Cohesion: 0.24
Nodes (6): findMembershipForTenant(), MembershipStore, hasTenantPermission(), ROLE_PERMISSIONS, TenantPermission, requireMembership()

### Community 25 - "apple-icon.tsx"
Cohesion: 0.47
Nodes (5): anel(), AppleIcon(), contentType, lamina(), size

### Community 26 - "13. Estratégia de testes e critérios globais de aceite"
Cohesion: 0.33
Nodes (6): 13.1. Isolamento de tenants, 13.2. Agendamento, 13.3. Clientes, 13.4. Planos, 13.5. Critério global de conclusão, 13. Estratégia de testes e critérios globais de aceite

### Community 27 - "8. Fluxos funcionais"
Cohesion: 0.33
Nodes (6): 8.1. Cadastro de uma nova barbearia, 8.2. Cadastro e convite de profissional, 8.3. Agendamento pelo cliente, 8.4. Cliente acessando estabelecimentos diferentes, 8.5. Cancelamento e suspensão de assinatura, 8. Fluxos funcionais

### Community 28 - "extends"
Cohesion: 0.33
Nodes (5): extends, rules, no-unused-vars, next/core-web-vitals, next/typescript

### Community 29 - "BarberLab"
Cohesion: 0.40
Nodes (4): Arquitetura e cuidados, Banco e ambiente, BarberLab, Desenvolvimento e verificação

### Community 30 - "19. Redis e processamento assíncrono — evolução futura (fora do MVP)"
Cohesion: 0.40
Nodes (5): 19.1. Critérios para reconsiderar Redis, 19.2. Possíveis usos futuros, 19.3. Requisitos para a futura implementação, 19.4. Backlog futuro sugerido (não bloqueia o lançamento), 19. Redis e processamento assíncrono — evolução futura (fora do MVP)

### Community 31 - "3. Avaliação do projeto atual"
Cohesion: 0.40
Nodes (5): 3.1. Stack identificada, 3.2. Estruturas atuais relevantes, 3.3. Pontos atuais que precisam ser alterados, 3.4. Estratégia de aproveitamento, 3. Avaliação do projeto atual

### Community 32 - "5. Rotas e experiência de navegação"
Cohesion: 0.40
Nodes (5): 5.1. Rotas públicas e institucionais, 5.2. Rotas administrativas da barbearia, 5.3. Rotas administrativas da plataforma, 5.4. Organização sugerida do App Router, 5. Rotas e experiência de navegação

### Community 33 - "9. Regras detalhadas do agendamento"
Cohesion: 0.40
Nodes (5): 9.1. Cálculo de disponibilidade, 9.2. Concorrência, 9.3. Fuso horário, 9.4. Regras de status, 9. Regras detalhadas do agendamento

### Community 34 - "next.config.mjs"
Cohesion: 0.40
Nodes (4): nextConfig, rootDir, withBundleAnalyzer, @next/bundle-analyzer

### Community 35 - "overrides"
Cohesion: 0.40
Nodes (5): hono, lodash, preact, pnpm, overrides

### Community 36 - "BarberLab"
Cohesion: 0.20
Nodes (9): BarberLab, Colors, Components, Do's and Don'ts, Elevation & Depth, Layout, Overview, Shapes (+1 more)

### Community 37 - "10. Planos comerciais"
Cohesion: 0.50
Nodes (4): 10.1. Proposta inicial de planos, 10.2. Funcionalidades, 10.3. Cobrança, 10. Planos comerciais

### Community 38 - "14. Migração e publicação em produção"
Cohesion: 0.50
Nodes (4): 14.1. Antes da migração, 14.2. Execução, 14.3. Rollback, 14. Migração e publicação em produção

### Community 39 - "rate-limit.ts"
Cohesion: 0.19
Nodes (11): Bookings(), getConcludedBookings(), toBookingItem(), createPrismaClient(), getPool(), createLimiter(), getLimiter(), limiters (+3 more)

### Community 40 - "1. Objetivo e visão do produto"
Cohesion: 0.67
Nodes (3): 1.1. Resultados esperados, 1.2. Fora do escopo do primeiro lançamento, 1. Objetivo e visão do produto

### Community 51 - "catalog-home.tsx"
Cohesion: 0.07
Nodes (30): handler, BookingItem(), Footer(), QuickSearchOption, quickSearchOptions, BarbershopPage(), generateMetadata(), AccessNotice() (+22 more)

### Community 62 - "barbershop-registration-schema.ts"
Cohesion: 0.40
Nodes (4): BarbershopRegistrationInput, barbershopRegistrationSchema, reservedSlugs, valid

## Knowledge Gaps
- **331 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `no-unused-vars`, `timeSchema`, `createSchema` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 369 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `button.tsx` to `(admin)/schedule/page.tsx`, `package.json`, `app/layout.tsx`, `user-menu.tsx`, `catalog-home.tsx`, `cn`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `next` connect `button.tsx` to `create-booking.ts`, `(admin)/schedule/page.tsx`, `package.json`, `app/layout.tsx`, `auth.ts`, `catalog-home.tsx`, `cn`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `no-unused-vars` to the rest of the system?**
  _331 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05527805527805528 - nodes in this community are weakly interconnected._
- **Should `(admin)/schedule/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07909604519774012 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._