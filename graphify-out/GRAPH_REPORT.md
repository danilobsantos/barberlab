# Graph Report - BarberLab  (2026-11-10)

## Corpus Check
- 252 files · ~259,229 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1040 nodes · 2725 edges · 62 communities (45 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c60fbfa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- database-context.ts
- get-bookings.ts
- booking-item.tsx
- package.json
- button.tsx
- dependencies
- 6. Modelo de dados alvo
- devDependencies
- service-form-dialog.tsx
- compilerOptions
- components.json
- Desktop
- cn
- withTenantContext
- [slug]/layout.tsx
- BarberLab SaaS — Arquitetura Técnica e Plano de Implementação
- 11. Plano de implementação por fases e prioridade
- calendar.tsx
- 7. Regras de acesso e segurança multitenant
- scripts
- page-skeleton.tsx
- password-auth.ts
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
- preload.cjs
- 1. Objetivo e visão do produto
- eslint.config.mjs
- postcss.config.mjs
- proxy.ts
- docker-entrypoint.sh
- commit-msg
- lint-staged
- prisma
- (admin)/error.tsx
- minha-conta/page.tsx
- auth.ts
- app/layout.tsx
- professional-invitations.ts
- nodemailer.d.ts
- react

## God Nodes (most connected - your core abstractions)
1. `cn()` - 66 edges
2. `withTenantContext()` - 65 edges
3. `consumeRateLimit()` - 59 edges
4. `Button` - 48 edges
5. `requireAdminContext()` - 45 edges
6. `@prisma/client` - 43 edges
7. `lucide-react` - 43 edges
8. `react` - 41 edges
9. `rateLimitError()` - 35 edges
10. `auth()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/create-local-test-fixture.ts → app/_lib/password-crypto.ts
- `CardDescription` --calls--> `cn()`  [EXTRACTED]
  app/_components/ui/card.tsx → app/_lib/utils.ts
- `SheetOverlay` --calls--> `cn()`  [EXTRACTED]
  app/_components/ui/sheet.tsx → app/_lib/utils.ts
- `SheetDescription` --calls--> `cn()`  [EXTRACTED]
  app/_components/ui/sheet.tsx → app/_lib/utils.ts
- `BarbershopProfileForm()` --calls--> `saveBarbershopProfile()`  [EXTRACTED]
  app/(admin)/_components/barbershop-profile-form.tsx → app/(admin)/_actions/barbershop.ts

## Import Cycles
- None detected.

## Communities (62 total, 8 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.05
Nodes (52): BlockManager(), BookingRow(), BookingRowProps, DayNavigator(), DayNavigatorProps, EmptyState(), EmptyStateProps, PageHeader() (+44 more)

### Community 1 - "database-context.ts"
Cohesion: 0.06
Nodes (52): setPlatformBarbershopStatus(), savePlatformPlan(), setPlatformPlanActive(), savePlatformSubscription(), formatDate(), metadata, paymentInstructions, TenantSubscriptionPage() (+44 more)

### Community 2 - "get-bookings.ts"
Cohesion: 0.05
Nodes (58): createBooking(), getServiceProfessionals(), getUnavailableIntervals(), Footer(), ServiceItem(), AccessNotice(), MESSAGES, BarbershopDetail() (+50 more)

### Community 3 - "booking-item.tsx"
Cohesion: 0.11
Nodes (26): BookingItemProps, BookingSummary(), BookingSummaryProps, Decimal, PhoneItem(), PhoneItemProps, ServiceItemProps, Badge() (+18 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (37): name, private, version, @auth/prisma-adapter, @bprogress/next, clsx, eslint, eslint-config-prettier (+29 more)

### Community 5 - "button.tsx"
Cohesion: 0.17
Nodes (16): AdminTopbarProps, AdminPanelLink(), HeaderProps, SidebarSheet(), SignInDialog(), Avatar, AvatarFallback, AvatarImage (+8 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, @auth/prisma-adapter, @bprogress/next, class-variance-authority, clsx, date-fns, driver.js, @hookform/resolvers (+23 more)

### Community 7 - "6. Modelo de dados alvo"
Cohesion: 0.07
Nodes (28): 6.1. Identidade e autenticação, 6.2. Tenant e perfil da barbearia, 6.3. Profissionais e equipe, 6.4. Clientes isolados por tenant, 6.5. Serviços, 6.6. Horários e disponibilidade, 6.7. Agendamentos, 6.8. Planos e assinaturas (+20 more)

### Community 8 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-next, eslint-config-prettier, @eslint/eslintrc, @eslint/js, @eslint/migrate-config, eslint-plugin-prettier (+17 more)

### Community 9 - "service-form-dialog.tsx"
Cohesion: 0.17
Nodes (20): BlockManagerProps, PRESETS, OpeningHoursForm(), DURATION_OPTIONS, EMPTY, ServiceFormDialog(), ServiceFormDialogProps, ServicesManagerProps (+12 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 13 - "Desktop"
Cohesion: 0.12
Nodes (15): Agendamentos, Agendamentos, Barbearia e Serviços, Barbearia e Serviços, Barbearias, Barbearias, 🧱 BarberLab, 📸 Demonstrações (+7 more)

### Community 15 - "cn"
Cohesion: 0.19
Nodes (17): BarbershopProfileForm(), CardFooter, DialogOverlay, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue (+9 more)

### Community 16 - "withTenantContext"
Cohesion: 0.07
Nodes (61): ExistingCustomerAccountError, registerBarbershop(), RegistrationState, saveTenantCustomer(), saveBarbershopProfile(), completeOnboarding(), saveOpeningHours(), cancelProfessionalInvitation() (+53 more)

### Community 17 - "[slug]/layout.tsx"
Cohesion: 0.20
Nodes (11): getAdminNavItems(), NAV_ITEMS, AdminSidebar(), AdminSidebarProps, AdminTabBar(), AdminTopbar(), elementoVisivel(), OnboardingTour() (+3 more)

### Community 18 - "BarberLab SaaS — Arquitetura Técnica e Plano de Implementação"
Cohesion: 0.15
Nodes (12): 12. Dependências e caminho crítico, 15. Configuração de ambiente e deploy, 16. Estimativa de esforço, 17. Decisões ainda pendentes antes do desenvolvimento de cada módulo, 18. Recomendação final e ordem imediata de execução, 20. Referências do projeto, 2.1. Interpretação da decisão sobre clientes isolados, 2.2. Decisão sobre URLs (+4 more)

### Community 19 - "11. Plano de implementação por fases e prioridade"
Cohesion: 0.20
Nodes (10): 11. Plano de implementação por fases e prioridade, Fase 0 — Preparação, inventário e baseline, Fase 1 — Fundação multitenant e schema, Fase 2 — Backfill e migração de dados, Fase 3 — Autenticação, tenant context e autorização, Fase 4 — Cadastro e gestão de profissionais, Fase 5 — Motor de agendamento multi-profissional, Fase 6 — Perfil público, clientes e remoção do marketplace (+2 more)

### Community 20 - "calendar.tsx"
Cohesion: 0.60
Nodes (4): buttonVariants, Calendar(), CalendarDayButton(), react-day-picker

### Community 21 - "7. Regras de acesso e segurança multitenant"
Cohesion: 0.25
Nodes (8): 7.1. Papéis e permissões, 7.2. Contexto do tenant, 7.3. Padrão de consulta, 7.4. PostgreSQL Row-Level Security (RLS), 7.5. Proteção de arquivos, 7.6. Rate limiting e cache no MVP, 7.7. Proteções adicionais, 7. Regras de acesso e segurança multitenant

### Community 22 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, analyze, build, dev, lint, lint:fix, prepare, start (+3 more)

### Community 24 - "password-auth.ts"
Cohesion: 0.10
Nodes (21): requestPasswordReset(), resetPassword(), PasswordResetForm(), PasswordResetRequestForm(), accountTypeSchema, normalizedEmailSchema, passwordCredentialsSchema, passwordRegistrationSchema (+13 more)

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

### Community 39 - "preload.cjs"
Cohesion: 0.50
Nodes (3): Module, path, stubs

### Community 40 - "1. Objetivo e visão do produto"
Cohesion: 0.67
Nodes (3): 1.1. Resultados esperados, 1.2. Fora do escopo do primeiro lançamento, 1. Objetivo e visão do produto

### Community 51 - "(admin)/error.tsx"
Cohesion: 0.23
Nodes (6): ErrorProps, HomeButton(), StatusScreen(), StatusScreenProps, ErrorProps, metadata

### Community 53 - "minha-conta/page.tsx"
Cohesion: 0.14
Nodes (17): BookingItem(), ButtonProps, WhatsAppButton(), WhatsAppButtonProps, AccountPageProps, TenantCustomerAccount(), formatBookingDateTime(), canCancelBooking() (+9 more)

### Community 54 - "auth.ts"
Cohesion: 0.09
Nodes (30): deleteBooking(), schema, updateOwnPhone(), handler, CadastroPage(), BookingItemData, Booking, Bookings() (+22 more)

### Community 55 - "app/layout.tsx"
Cohesion: 0.16
Nodes (10): DemoBanner(), Providers(), Toaster(), ToasterProps, inter, metadata, viewport, isDemo (+2 more)

### Community 57 - "professional-invitations.ts"
Cohesion: 0.05
Nodes (49): acceptMembershipInvitation(), inviteUrl(), professionalIdSchema, revalidateTeam(), sendInvitationEmail(), sendProfessionalInvitation(), BarbershopProfileFormProps, OpeningHoursFormProps (+41 more)

### Community 61 - "nodemailer.d.ts"
Cohesion: 0.33
Nodes (3): Message, nodemailer, Transporter

### Community 73 - "react"
Cohesion: 0.24
Nodes (11): registerPasswordAccount(), fields, EmailSignIn(), AccountType, AuthAccountType, PasswordAuthForm(), Input, Label (+3 more)

## Knowledge Gaps
- **384 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `no-unused-vars`, `professionalIdSchema`, `schema` (+379 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 440 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `database-context.ts` to `lucide-react`, `get-bookings.ts`, `booking-item.tsx`, `package.json`, `withTenantContext`, `minha-conta/page.tsx`, `auth.ts`, `password-auth.ts`, `professional-invitations.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `database-context.ts`, `get-bookings.ts`, `booking-item.tsx`, `package.json`, `button.tsx`, `service-form-dialog.tsx`, `cn`, `withTenantContext`, `[slug]/layout.tsx`, `(admin)/error.tsx`, `calendar.tsx`, `minha-conta/page.tsx`, `auth.ts`, `app/layout.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `lucide-react`, `get-bookings.ts`, `booking-item.tsx`, `package.json`, `button.tsx`, `service-form-dialog.tsx`, `cn`, `withTenantContext`, `[slug]/layout.tsx`, `(admin)/error.tsx`, `calendar.tsx`, `auth.ts`, `app/layout.tsx`, `professional-invitations.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `no-unused-vars` to the rest of the system?**
  _384 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05421686746987952 - nodes in this community are weakly interconnected._
- **Should `database-context.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05660945498343872 - nodes in this community are weakly interconnected._
- **Should `get-bookings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05230678812812224 - nodes in this community are weakly interconnected._