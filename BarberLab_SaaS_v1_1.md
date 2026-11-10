# BarberLab SaaS — Arquitetura Técnica e Plano de Implementação

**Documento de especificação técnica**  
**Versão:** 1.1  
**Data:** 09/11/2026  
**Projeto-base:** [LuanPaD/BarberLab](https://github.com/LuanPaD/BarberLab)  
**Objetivo:** evoluir o BarberLab de uma aplicação com conceito de marketplace para uma plataforma SaaS multitenant de gestão e agendamento independente para barbearias.

---

## 1. Objetivo e visão do produto

O BarberLab será transformado em um SaaS no qual cada barbearia terá um ambiente próprio, com perfil público, equipe, serviços, clientes, agenda e configurações independentes.

A plataforma **não será um marketplace**. Não haverá catálogo, pesquisa, comparação ou listagem pública de barbearias. O cliente final deverá acessar diretamente o endereço da barbearia, por meio de seu slug, e realizar o agendamento naquele estabelecimento.

A aplicação e a infraestrutura serão compartilhadas, mas os dados operacionais e administrativos de cada barbearia serão isolados logicamente.

### 1.1. Resultados esperados

- Uma única aplicação atenderá várias barbearias.
- Cada barbearia terá um perfil público acessível por URL própria.
- Cada barbearia poderá cadastrar vários profissionais.
- Cada profissional terá sua própria agenda, jornada e bloqueios.
- Serviços poderão ser associados a um ou mais profissionais.
- Cada barbearia terá sua própria base de clientes e histórico.
- Usuários internos terão permissões conforme seu vínculo com a barbearia.
- A plataforma terá um painel central para administrar estabelecimentos, planos e assinaturas.
- Os planos terão limites fixos de profissionais e funcionalidades.
- Nenhum tenant poderá consultar ou modificar dados operacionais de outro tenant.

### 1.2. Fora do escopo do primeiro lançamento

Os itens abaixo não são requisitos para o MVP e poderão ser adicionados em versões posteriores:

- Marketplace ou busca pública de barbearias.
- Comparação de preços entre estabelecimentos.
- Aplicativo móvel nativo.
- Controle de estoque e compras.
- Comissões e repasses financeiros por profissional.
- PDV e fechamento de caixa completo.
- Programa de fidelidade.
- Campanhas de marketing e automações avançadas.
- Integrações com WhatsApp e pagamentos online, além da estrutura necessária para suportá-las.

---

## 2. Decisões de produto e arquitetura aprovadas

Esta seção registra as decisões tomadas para orientar todas as fases de desenvolvimento.

| Tema | Decisão | Consequência técnica |
|---|---|---|
| Modelo de produto | SaaS de gestão independente para barbearias | Remover o conceito de marketplace e a pesquisa pública de estabelecimentos |
| Multitenancy | Banco e aplicação compartilhados | Isolamento lógico por `barbershopId` |
| Base de dados | PostgreSQL compartilhado | Um schema principal com relações tenant-aware |
| ORM | Prisma | Manter Prisma e adaptar o schema atual |
| Frontend/backend | Next.js full-stack | Manter App Router, Server Actions e serviços server-side |
| Linguagem | TypeScript | Manter a linguagem atual |
| Identificação pública | Path/slug | `seudominio.com.br/{slug}` |
| Painel do tenant | Painel autenticado por estabelecimento | Resolver o tenant e validar membership no servidor |
| Clientes | Cadastro operacional isolado por barbearia | Uma entidade `Customer` distinta para cada tenant |
| Identidade de autenticação | Global, com vínculos opcionais aos cadastros locais | `User` não será a própria ficha de cliente; cada `Customer` pertence a uma barbearia |
| Profissionais | Vários por barbearia | Entidade `Professional` própria, independente de `User` |
| Agenda | Independente por profissional | Conflitos avaliados por profissional e intervalo de tempo |
| Planos | Planos fixos | Limites e funcionalidades definidos por plano |
| Cobrança | Por barbearia/assinatura, não por uso individual | Não haverá cobrança variável por agendamento ou por profissional adicional fora dos limites do plano |
| Infraestrutura | Compartilhada | Uma aplicação, PostgreSQL e armazenamento compartilhados |
| Arquivos | MinIO | Objetos e caminhos organizados por tenant |
| Rate limiting no MVP | PostgreSQL, usando a implementação atual com `rate-limiter-flexible` | Manter a tabela `RateLimit` no PostgreSQL; as chaves deverão considerar tenant/usuário conforme o escopo da regra |
| Redis | Fora do MVP; implementação futura | Não instalar nem exigir Redis na primeira versão. Avaliar posteriormente para cache distribuído, rate limiting distribuído e filas assíncronas |

### 2.1. Interpretação da decisão sobre clientes isolados

A decisão `isolated` significa que dados operacionais de clientes serão independentes por barbearia.

Exemplo: João agenda na Barbearia A e na Barbearia B. O sistema mantém dois registros `Customer`, cada um com seu próprio histórico, telefone, observações e relacionamento com agendamentos. A Barbearia A não terá acesso ao cadastro nem ao histórico de João na Barbearia B.

Para evitar duplicação desnecessária de credenciais, a proposta mantém `User` como identidade global de autenticação. Um mesmo login poderá estar associado a dois registros `Customer`, sem compartilhar os dados operacionais. A ligação entre `User` e `Customer` será opcional.

**Limite dessa decisão:** credenciais globais não significam compartilhamento de dados. Se o requisito comercial vier a exigir credenciais completamente distintas por barbearia, a autenticação deverá ser revista antes do lançamento. Para o plano atual, a identidade global com fichas locais isoladas é a arquitetura adotada.

### 2.2. Decisão sobre URLs

O perfil público terá o padrão:

- `seudominio.com.br/barbearia-central`
- `seudominio.com.br/barbearia-central/agendar`
- `seudominio.com.br/barbearia-central/minha-conta`

O painel terá o padrão:

- `seudominio.com.br/painel`
- `seudominio.com.br/painel/barbearia-central`
- `seudominio.com.br/painel/barbearia-central/equipe`
- `seudominio.com.br/painel/barbearia-central/agenda`

O slug será único, normalizado e validado no servidor. Slugs reservados (`painel`, `api`, `login`, `cadastro`, `precos`, entre outros) não poderão ser utilizados como identificadores de barbearia.

O slug identifica o estabelecimento, mas **não concede autorização**. A autorização administrativa dependerá do usuário autenticado e de seu vínculo `Membership` ativo.

---

## 3. Avaliação do projeto atual

A análise do repositório identificou uma base que pode ser aproveitada. Não há necessidade inicial de reescrever a aplicação.

### 3.1. Stack identificada

| Camada | Implementação atual |
|---|---|
| Aplicação | Next.js App Router |
| Linguagem | TypeScript |
| Banco | PostgreSQL |
| ORM | Prisma |
| Autenticação | NextAuth v4 / Prisma Adapter |
| Interface | React, Tailwind CSS e componentes shadcn/ui |
| Rate limit | `rate-limiter-flexible`, com `RateLimiterPostgres` e `RateLimiterMemory` como insurance limiter |
| Datas | `date-fns` |

As versões exatas devem ser confirmadas no lockfile e no ambiente local antes de iniciar as alterações.

**Implementação de rate limiting já existente:** `app/_lib/rate-limit.ts` cria limiters com `RateLimiterPostgres`, utiliza a tabela `RateLimit` via pool PostgreSQL e configura `RateLimiterMemory` como insurance limiter. Portanto, Redis não é necessário para preservar o rate limiting no MVP. Na refatoração multitenant, revisar a composição das chaves para evitar que limites por tenant sejam compartilhados indevidamente.

### 3.2. Estruturas atuais relevantes

O `schema.prisma` atual contém, entre outros:

- `User`, com `role` e `barbershopId` opcional.
- `Barbershop`, com dados do estabelecimento e relações com serviços, equipe, horários e bloqueios.
- `BarbershopService`, vinculado à barbearia.
- `Booking`, vinculado a `User` e `BarbershopService`, com um campo `date`.
- `OpeningHour`, com horários gerais da barbearia.
- `ScheduleBlock`, com bloqueios vinculados à barbearia.
- `Account`, `Session`, `VerificationToken` e `RateLimit`.

### 3.3. Pontos atuais que precisam ser alterados

1. O modelo `User.barbershopId` e o enum `Role` atual (`CUSTOMER`, `BARBER_ADMIN`) não representam memberships múltiplos nem permissões por estabelecimento.
2. A autenticação expõe `role` e `barbershopId` diretamente na sessão, o que precisa ser substituído por contexto de usuário e membership validado.
3. O cadastro de equipe atual está associado diretamente ao usuário e à barbearia; deverá ser separado do cadastro de profissional.
4. O modelo `Booking` não possui `barbershopId`, `professionalId`, `startsAt` e `endsAt` próprios.
5. A ação atual `create-booking.ts` verifica conflitos considerando os agendamentos da barbearia inteira, impedindo atendimentos simultâneos por profissionais diferentes.
6. A ação atual `get-bookings.ts` também calcula indisponibilidades pela barbearia/serviço, sem agenda individual.
7. A rota pública `/(customer)/barbershops` e a função `getBarbershopsBySearchParams` implementam busca/listagem de estabelecimentos, comportamento incompatível com o produto definido.
8. `deployment.ts` e `proxy.ts` contêm mecanismos de single-tenant e demo que não devem ser usados como mecanismo de identificação de tenants na arquitetura final.

### 3.4. Estratégia de aproveitamento

Manter e adaptar:

- Componentes visuais de perfil, serviço, calendário, resumo e agendamento quando compatíveis.
- Integração atual com PostgreSQL/Prisma.
- Autenticação NextAuth, após revisão de sessão e autorização.
- Estrutura Next.js App Router.
- Funcionalidades atuais de serviços, horários gerais, bloqueios e histórico, após adaptação ao tenant e ao profissional.

Remover ou substituir:

- Busca pública de barbearias.
- Cards e páginas que promovem descoberta de outros estabelecimentos.
- Dependência de um `barbershopId` único associado ao usuário.
- Verificação de agenda que bloqueia a barbearia inteira quando apenas um profissional está ocupado.

---

## 4. Arquitetura lógica de alto nível

A solução será um monólito modular multitenant.

```text
Navegador
   |
   v
Traefik / HTTPS
   |
   v
Next.js — BarberLab SaaS
   |
   +-- Site institucional e cadastro
   +-- Perfil público por slug
   +-- Agendamento do cliente
   +-- Painel da barbearia
   +-- Painel de administração da plataforma
   +-- Autenticação e autorização
   +-- Serviços de domínio
   |
   +---------------- PostgreSQL
   |                  +-- Identidades
   |                  +-- Tenants
   |                  +-- Memberships
   |                  +-- Profissionais
   |                  +-- Clientes
   |                  +-- Serviços
   |                  +-- Agendamentos
   |                  +-- Planos e assinaturas
   |
   +---------------- MinIO
                      +-- Logos
                      +-- Fotos de profissionais
                      +-- Imagens de serviços
```

### 4.1. Princípios de arquitetura

- Manter uma aplicação Next.js enquanto o volume e a complexidade justificarem um monólito modular.
- Não introduzir microsserviços no escopo inicial.
- Manter um banco PostgreSQL compartilhado.
- Não adicionar Redis como dependência do MVP; utilizar PostgreSQL para persistência, rate limiting e integridade transacional.
- Não introduzir cache distribuído antes de existir uma necessidade medida e uma estratégia de invalidação definida.
- Incluir `barbershopId` em todas as entidades operacionais pertencentes a um tenant.
- Validar o tenant no servidor em toda operação administrativa.
- Não confiar em `barbershopId` recebido do frontend como prova de autorização.
- Centralizar regras de domínio em serviços reutilizáveis; Server Actions devem validar entrada e chamar esses serviços.
- Separar administração da plataforma e administração da barbearia.
- Usar migrations incrementais e reversíveis sempre que possível.

---

## 5. Rotas e experiência de navegação

### 5.1. Rotas públicas e institucionais

| Rota | Finalidade |
|---|---|
| `/` | Página institucional/entrada do SaaS |
| `/precos` | Apresentação dos planos |
| `/cadastro` | Cadastro de barbearia/proprietário |
| `/login` | Autenticação |
| `/{slug}` | Perfil público da barbearia |
| `/{slug}/agendar` | Fluxo de agendamento |
| `/{slug}/minha-conta` | Área do cliente naquele tenant |
| `/{slug}/profissionais` | Profissionais públicos, caso habilitado |
| `/{slug}/servicos` | Catálogo de serviços daquele tenant |

### 5.2. Rotas administrativas da barbearia

| Rota | Finalidade |
|---|---|
| `/painel/{slug}` | Dashboard da barbearia |
| `/painel/{slug}/agenda` | Agenda e bloqueios |
| `/painel/{slug}/equipe` | Profissionais, convites e permissões |
| `/painel/{slug}/servicos` | Serviços e associações com profissionais |
| `/painel/{slug}/clientes` | Base local de clientes |
| `/painel/{slug}/relatorios` | Indicadores e relatórios |
| `/painel/{slug}/configuracoes` | Perfil, horários e preferências |
| `/painel/{slug}/assinatura` | Plano e situação da assinatura |

### 5.3. Rotas administrativas da plataforma

| Rota | Finalidade |
|---|---|
| `/painel` | Visão geral da plataforma, protegida por `SUPER_ADMIN` |
| `/painel/barbearias` | Gestão de tenants |
| `/painel/planos` | Gestão de planos |
| `/painel/assinaturas` | Gestão de assinaturas |
| `/painel/usuarios` | Gestão de usuários administrativos |
| `/painel/auditoria` | Auditoria de ações administrativas |

A resolução de conflito entre `/painel` da plataforma e `/painel/{slug}` da barbearia deverá ser implementada explicitamente. Recomenda-se que a rota `/painel` seja exclusiva para administração da plataforma e que `/painel/{slug}` seja acessível somente após verificação de membership.

### 5.4. Organização sugerida do App Router

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── precos/
│   └── cadastro/
├── (tenant)/
│   └── [slug]/
│       ├── page.tsx
│       ├── agendar/
│       ├── minha-conta/
│       ├── profissionais/
│       └── servicos/
├── (dashboard)/
│   └── painel/
│       ├── page.tsx
│       └── [slug]/
│           ├── page.tsx
│           ├── agenda/
│           ├── equipe/
│           ├── clientes/
│           ├── servicos/
│           ├── relatorios/
│           ├── configuracoes/
│           └── assinatura/
├── _actions/
├── _components/
└── _lib/
    ├── auth/
    ├── tenant/
    ├── permissions/
    └── services/
```

Os diretórios de Route Groups entre parênteses não aparecem na URL. A estrutura real deve evitar colisões entre rotas estáticas e dinâmicas.

---

## 6. Modelo de dados alvo

O schema abaixo é a especificação conceitual de destino. Os nomes finais e detalhes de sintaxe Prisma devem ser validados ao implementar as relações, principalmente as chaves estrangeiras compostas tenant-aware.

### 6.1. Identidade e autenticação

#### `User`

Representa a identidade global de autenticação.

Campos conceituais:

- `id`
- `name`
- `email` (único para autenticação)
- `emailVerified`
- `image`
- `phone` (opcional, dado geral de contato; não substitui telefone da ficha local de cliente)
- `platformRole` ou relação equivalente para privilégio global
- `createdAt`
- `updatedAt`

Relações:

- `Account[]`
- `Session[]`
- `Membership[]`
- `Customer[]` opcionais
- `Professional[]` opcionais

Não utilizar `User.barbershopId` como vínculo único do usuário.

#### `Membership`

Vínculo de um usuário com uma barbearia.

Campos conceituais:

- `id`
- `userId`
- `barbershopId`
- `role`: `OWNER`, `MANAGER` ou `PROFESSIONAL`
- `status`: `INVITED`, `ACTIVE`, `SUSPENDED` ou `REVOKED`
- `invitedAt`
- `acceptedAt`
- `createdAt`
- `updatedAt`

Restrições:

- `@@unique([userId, barbershopId])`
- Índices por `barbershopId`, `userId` e `status`.
- Não permitir mais de um vínculo ativo equivalente para a mesma combinação usuário/tenant.

O proprietário inicial será criado com membership `OWNER`. Um usuário poderá ter memberships em mais de uma barbearia.

#### `PlatformRole`

Pode ser implementado como enum/campo em `User` ou como tabela de papéis globais. O primeiro lançamento pode utilizar `platformRole` com `SUPER_ADMIN` e `NONE`, desde que não confunda esse privilégio com os papéis de `Membership`.

### 6.2. Tenant e perfil da barbearia

#### `Barbershop`

Campos conceituais:

- `id`
- `name`
- `slug` (único, normalizado)
- `description`
- `address`
- `phones`
- `email`
- `imageUrl`/`logoUrl`
- `coverImageUrl` (opcional)
- `timezone` (padrão `America/Sao_Paulo`)
- `status`: `PENDING_SETUP`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`
- `createdAt`
- `updatedAt`

Restrições:

- `slug` único.
- Índice em `status`.
- Reservar slugs de rotas da aplicação.

### 6.3. Profissionais e equipe

#### `Professional`

Entidade operacional de profissional, independente da existência de login.

Campos conceituais:

- `id`
- `barbershopId`
- `userId` opcional
- `name`
- `displayName` opcional
- `email` opcional
- `phone` opcional
- `bio` opcional
- `imageUrl` opcional
- `calendarColor` opcional
- `status`: `ACTIVE`, `INACTIVE`
- `createdAt`
- `updatedAt`

Restrições:

- Índice por `barbershopId` e `status`.
- Relação opcional com `User` para liberar login e acesso à agenda.
- Se o profissional tiver usuário, garantir consistência entre `Professional`, `Membership` e `barbershopId`.
- Um profissional cadastrado sem usuário poderá receber convite posteriormente.

#### `ProfessionalService`

Associação N:N entre profissionais e serviços.

Campos:

- `professionalId`
- `serviceId`
- `barbershopId` (para integridade tenant-aware, se adotado no desenho final)
- `createdAt`

Restrições:

- Unicidade por profissional/serviço.
- Impedir associação entre profissional e serviço de tenants diferentes por validação no banco e no serviço de domínio.

### 6.4. Clientes isolados por tenant

#### `Customer`

Cada barbearia terá sua própria ficha de cliente.

Campos conceituais:

- `id`
- `barbershopId`
- `userId` opcional
- `name`
- `email` opcional
- `phone`
- `notes` (observações privadas da barbearia)
- `createdAt`
- `updatedAt`

Restrições:

- Índices por `barbershopId`, telefone e e-mail.
- Não impor unicidade global de e-mail/telefone em `Customer`.
- Se for necessário impedir duplicidade dentro de uma barbearia, aplicar unicidade composta por tenant e identificador normalizado, respeitando a possibilidade de campos nulos.
- Um mesmo `User` poderá se relacionar com vários `Customer`, um por tenant.
- Não expor observações internas em páginas públicas ou para outros tenants.

### 6.5. Serviços

#### `BarbershopService`

Campos conceituais:

- `id`
- `barbershopId`
- `name`
- `description`
- `imageUrl`
- `price` (`Decimal`)
- `durationMinutes`
- `isActive`
- `createdAt`
- `updatedAt`

O serviço pertence a uma única barbearia e pode ser executado por vários profissionais por meio de `ProfessionalService`.

No primeiro MVP, preço e duração serão definidos pelo serviço. Caso seja necessário preço/duração diferente por profissional, incluir uma entidade de configuração `ProfessionalService` com os respectivos overrides — não duplicar serviços.

### 6.6. Horários e disponibilidade

#### `OpeningHour`

Define os horários gerais de funcionamento da barbearia. Pode ser mantido a partir do modelo atual.

Campos:

- `id`
- `barbershopId`
- `weekday`
- `opensAt`
- `closesAt`
- `isClosed`

#### `ProfessionalSchedule`

Define a jornada de cada profissional.

Campos conceituais:

- `id`
- `barbershopId`
- `professionalId`
- `weekday`
- `startsAtLocal`
- `endsAtLocal`
- `createdAt`
- `updatedAt`

Permitir mais de um intervalo no mesmo dia para suportar almoço, pausas e turnos divididos.

#### `ProfessionalScheduleException`

Representa exceções por data: férias, folga, jornada especial ou alteração pontual.

Campos conceituais:

- `id`
- `barbershopId`
- `professionalId`
- `date`
- `type`: `UNAVAILABLE` ou `CUSTOM_HOURS`
- `startsAtLocal` opcional
- `endsAtLocal` opcional
- `reason` opcional

Para a mesma data, pode existir uma exceção de cada tipo; `UNAVAILABLE` prevalece sobre `CUSTOM_HOURS`. BL-061 implementa essa precedência no cálculo da disponibilidade.

#### `ScheduleBlock`

Bloqueio de agenda.

Campos conceituais:

- `id`
- `barbershopId`
- `professionalId` opcional
- `startsAt`
- `endsAt`
- `reason`
- `createdAt`
- `updatedAt`

Regra:

- `professionalId = null`: bloqueio geral da barbearia.
- `professionalId` preenchido: bloqueio somente daquele profissional.

### 6.7. Agendamentos

#### `Booking`

Campos conceituais recomendados:

- `id`
- `barbershopId`
- `customerId`
- `professionalId`
- `serviceId`
- `startsAt` (`timestamptz`)
- `endsAt` (`timestamptz`)
- `status`: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELED`, `NO_SHOW`
- `priceSnapshot`
- `durationMinutesSnapshot`
- `customerNameSnapshot` opcional
- `customerPhoneSnapshot` opcional
- `notes` conforme política do produto
- `createdAt`
- `updatedAt`

Regras:

- O agendamento deve apontar para cliente, profissional e serviço do mesmo tenant.
- O profissional precisa estar associado ao serviço.
- O término deve ser posterior ao início.
- O intervalo é semiaberto `[startsAt, endsAt)`, permitindo que um atendimento termine no mesmo instante em que o próximo começa.
- Alterações futuras de preço/duração do serviço não podem modificar o histórico do booking.
- Cancelamentos devem preservar histórico; evitar exclusão física de reservas confirmadas.
- Os status considerados ocupantes de agenda devem ser definidos explicitamente. No mínimo `PENDING` e `CONFIRMED` impedem sobreposição.

#### Integridade contra sobreposição

O PostgreSQL deve impedir dois agendamentos ocupantes de agenda para o mesmo profissional no mesmo intervalo. Recomenda-se uma constraint de exclusão GiST baseada em `professionalId` e `tstzrange(startsAt, endsAt, '[)')`, com condição para status ativos.

Se o isolamento por tenant for incluído diretamente na constraint, usar também `barbershopId`. Como `professionalId` deve ser único globalmente, a restrição por profissional já reduz o risco de mistura, mas as chaves estrangeiras compostas continuam necessárias para a integridade dos relacionamentos.

A constraint SQL deverá ser criada em migration customizada do Prisma. A aplicação deve tratar a violação como conflito de horário e devolver mensagem adequada.

### 6.8. Planos e assinaturas

#### `Plan`

Campos:

- `id`
- `name`
- `slug`
- `description`
- `priceMonthly`
- `maxProfessionals`
- `features` (JSON ou estrutura normalizada)
- `isActive`
- `createdAt`
- `updatedAt`

#### `Subscription`

Campos:

- `id`
- `barbershopId`
- `planId`
- `status`: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `SUSPENDED`
- `priceAtSubscription`
- `currentPeriodStart`
- `currentPeriodEnd`
- `startedAt`
- `canceledAt` opcional
- `externalCustomerId` opcional
- `externalSubscriptionId` opcional
- `createdAt`
- `updatedAt`

Regras:

- Uma assinatura vigente principal por barbearia.
- Guardar o preço contratado como snapshot para preservar histórico comercial.
- O plano determina limites e features habilitados.
- A aplicação deve validar limites no servidor, inclusive em operações concorrentes de criação de profissionais.
- Upgrade/downgrade deve registrar a alteração e definir quando o novo limite passa a valer.
- Suspensão comercial não deve apagar dados da barbearia.

#### `PaymentEvent` / `SubscriptionEvent`

Preparar uma tabela de eventos para registrar webhooks e alterações de assinatura. Armazenar identificador externo único para garantir idempotência e impedir processamento duplicado.

A escolha do gateway de pagamento permanece em aberto. A arquitetura deverá usar uma interface/adaptador para evitar acoplamento do domínio ao fornecedor.

### 6.9. Auditoria

#### `AuditLog`

Registrar operações sensíveis:

- Criação/alteração de usuários e memberships.
- Alteração de permissões.
- Alteração de plano/assinatura.
- Suspensão/reativação de barbearia.
- Alterações relevantes em dados operacionais.
- Ações de superadministradores.

Campos mínimos: `id`, `barbershopId` opcional, `actorUserId`, `action`, `entityType`, `entityId`, `metadata` controlado, `createdAt`.

Não armazenar senhas, tokens ou dados sensíveis desnecessários nos logs.

---

## 7. Regras de acesso e segurança multitenant

Esta seção é crítica para o lançamento. Ocultar dados na interface não é isolamento suficiente.

### 7.1. Papéis e permissões

| Papel | Acesso recomendado |
|---|---|
| `SUPER_ADMIN` | Toda a plataforma, tenants, planos, assinaturas e auditoria |
| `OWNER` | Todos os dados e configurações da própria barbearia |
| `MANAGER` | Operação da própria barbearia, conforme permissões atribuídas |
| `PROFESSIONAL` | Própria agenda, atendimentos e dados mínimos necessários |
| Cliente autenticado | Somente sua ficha e seus agendamentos naquele tenant |
| Cliente sem login | Somente fluxo público permitido; sem acesso a painel |

A autorização deve ser baseada em permissões verificadas no servidor. O nome do papel não deve ser a única condição quando uma funcionalidade exige restrição mais fina.

### 7.2. Contexto do tenant

Criar uma camada central, por exemplo:

```text
app/_lib/tenant/
  resolve-tenant.ts
  require-membership.ts
  tenant-context.ts
  tenant-permissions.ts
```

Responsabilidades:

- Resolver `slug` para `Barbershop` nas rotas públicas.
- Verificar status do tenant.
- Em rotas administrativas, verificar sessão autenticada.
- Buscar `Membership` ativo para a barbearia indicada na URL.
- Validar papel e permissões.
- Entregar um contexto confiável às funções de domínio.

O contexto de tenant não deve ser obtido de um campo livre enviado pelo navegador sem validação.

### 7.3. Padrão de consulta

Toda consulta administrativa deve filtrar pelo tenant autorizado. Exemplos conceituais:

```ts
// Evitar: consulta somente pelo identificador recebido.
// db.booking.findUnique({ where: { id: bookingId } })

// Preferir consulta que também valida o tenant.
// db.booking.findFirst({
//   where: { id: bookingId, barbershopId: tenant.id }
// })
```

Para updates/deletes, repetir a condição tenant-aware. Nunca carregar um registro por ID, confiar no frontend e só então decidir se o usuário tem acesso.

### 7.4. PostgreSQL Row-Level Security (RLS)

RLS é recomendada como camada adicional, não como substituto da autorização na aplicação.

A ativação deverá ocorrer somente depois que o padrão de transações e o contexto tenant-aware estiverem bem definidos.

Com pool de conexões, não usar `SET` de sessão persistente sem controle, pois uma conexão pode ser reutilizada por outro tenant. O padrão deve usar transação e configuração local à transação (por exemplo, `SET LOCAL`/`set_config(..., true)`), garantindo que o contexto seja aplicado e removido no ciclo correto.

Antes de habilitar RLS em produção, criar testes que provem que:

- Consultas sem contexto de tenant não retornam dados tenant-owned.
- Uma transação do tenant A não lê dados do tenant B.
- O contexto não vaza quando a conexão retorna ao pool.
- Tarefas administrativas controladas usam papel/fluxo específico e auditável.

### 7.5. Proteção de arquivos

- Organizar objetos em prefixos por tenant, por exemplo `barbershops/{barbershopId}/...`.
- Não confiar no prefixo fornecido pelo cliente.
- Validar membership antes de upload, leitura ou exclusão de arquivos privados.
- Utilizar URLs assinadas com prazo limitado quando necessário.
- Separar imagens públicas de arquivos privados.

### 7.6. Rate limiting e cache no MVP

**Redis não será instalado nem utilizado na primeira versão comercial.** O projeto atual já possui uma implementação de rate limiting com `rate-limiter-flexible`, `RateLimiterPostgres`, a tabela `RateLimit` no PostgreSQL e `RateLimiterMemory` como insurance limiter. A decisão é preservar essa abordagem no MVP, adaptando as chaves e os escopos para o modelo multitenant.

Regras para o MVP:

- Manter o PostgreSQL como armazenamento compartilhado do rate limiting, utilizando a tabela `RateLimit`.
- Incluir o identificador do tenant na chave quando o limite for específico de uma barbearia; incluir também usuário ou IP conforme a natureza da operação.
- Definir limites distintos para login, cadastro, consulta de disponibilidade, criação/cancelamento de reservas e operações administrativas.
- Monitorar erros do armazenamento do rate limiter. A implementação atual permite a requisição quando ocorre uma falha inesperada (fail-open); revisar e documentar a política por tipo de endpoint antes da produção.
- Tratar `RateLimiterMemory` como fallback local ao processo, não como contador global entre múltiplas instâncias.
- Não adicionar cache de disponibilidade no MVP. Consultar e validar a agenda no PostgreSQL no momento da leitura e, obrigatoriamente, novamente na confirmação do agendamento.
- Não armazenar dados privados de clientes ou painéis em cache compartilhado.

O Redis poderá ser adotado em uma fase futura, quando métricas justificarem rate limiting distribuído, cache de leituras recorrentes ou processamento assíncrono por filas. Qualquer cache de disponibilidade futuro deverá possuir chaves tenant-aware, TTL curto e invalidação em criação, cancelamento e alteração de agendamento/horário. O cache nunca será a fonte definitiva da disponibilidade.

### 7.7. Proteções adicionais

- Validar inputs com Zod ou equivalente em todas as Server Actions.
- Validar autorização em cada Server Action, mesmo quando a página já está protegida.
- Aplicar rate limiting em login, cadastro, consulta de disponibilidade e criação de reservas por meio da solução PostgreSQL existente no MVP; Redis não é requisito desta fase.
- Configurar cookies seguros em produção e origem confiável.
- Proteger webhooks por assinatura/segredo e idempotência.
- Registrar eventos de auditoria.
- Definir política de retenção, exportação e exclusão de dados pessoais compatível com LGPD.

---

## 8. Fluxos funcionais

### 8.1. Cadastro de uma nova barbearia

1. Proprietário acessa `/cadastro`.
2. Cria ou autentica sua identidade `User`.
3. Informa nome, slug e dados iniciais da barbearia.
4. Servidor valida disponibilidade e slug reservado.
5. Cria `Barbershop` com status inicial definido.
6. Cria `Membership` do proprietário com papel `OWNER`.
7. Associa plano inicial ou período de teste conforme regra comercial.
8. Cria horários e configurações padrão.
9. Redireciona para o onboarding do painel.
10. O tenant passa a publicar seu perfil após completar os campos obrigatórios e estar ativo.

As etapas de criação devem ocorrer em transação para evitar estabelecimento sem proprietário ou membership órfão.

### 8.2. Cadastro e convite de profissional

1. Proprietário/gerente abre a área de equipe.
2. Cria registro `Professional`.
3. Informa nome, dados de contato e serviços executados.
4. Define jornada semanal e exceções.
5. O backend confere o limite do plano antes de ativar o profissional.
6. Opcionalmente envia convite para associar uma identidade `User`.
7. Quando o convite é aceito, cria/ativa `Membership` com papel `PROFESSIONAL`.

Um profissional pode existir sem login. Desativar profissional não deve apagar seus agendamentos históricos.

### 8.3. Agendamento pelo cliente

1. Cliente acessa `/{slug}`.
2. Escolhe serviço.
3. Escolhe profissional ou opção “qualquer profissional disponível”, caso habilitada.
4. Seleciona data.
5. Backend calcula disponibilidade com base na jornada, exceções, bloqueios e bookings.
6. Cliente seleciona horário.
7. Backend recalcula/valida o horário dentro da operação de criação.
8. Banco garante ausência de sobreposição.
9. Cria `Customer` local se ainda não existir, conforme regra de identificação definida.
10. Cria `Booking` com snapshots de preço e duração.
11. Exibe confirmação e registra o histórico no tenant.

**Autenticação para agendamento:** o código atual exige usuário autenticado. Para o MVP, manter esse comportamento é a opção de menor risco. O suporte a agendamento como convidado deve ser decidido explicitamente antes da implementação do fluxo; caso habilitado, exigirá verificação de contato e proteção contra reservas abusivas.

### 8.4. Cliente acessando estabelecimentos diferentes

1. O cliente utiliza a identidade global de autenticação, se aplicável.
2. Ao acessar o slug de cada barbearia, o sistema procura o `Customer` daquele tenant.
3. Se não existir, cria uma ficha local após validar os dados.
4. Histórico, dados de contato locais e observações permanecem separados.
5. Não exibir histórico ou dados de outra barbearia.

### 8.5. Cancelamento e suspensão de assinatura

- O status da assinatura é atualizado por ação administrativa ou evento do gateway.
- Uma assinatura `PAST_DUE` pode entrar em período de tolerância configurável.
- Ao fim da tolerância, o tenant pode ser suspenso para novas operações conforme política comercial.
- Dados históricos são preservados.
- Reativar a assinatura deve restaurar acesso sem recriar tenant ou registros.
- Toda transição deve ser auditável.

---

## 9. Regras detalhadas do agendamento

### 9.1. Cálculo de disponibilidade

A disponibilidade de um profissional em uma data deve respeitar, nesta ordem lógica:

1. Status ativo da barbearia.
2. Status ativo do profissional.
3. Serviço ativo e pertencente à barbearia.
4. Associação entre profissional e serviço.
5. Horário geral de funcionamento.
6. Jornada específica do profissional.
7. Exceções de jornada.
8. Bloqueios gerais da barbearia.
9. Bloqueios individuais do profissional.
10. Agendamentos ocupantes de agenda.
11. Duração do serviço e margem/intervalo adicional, se configurado.

A consulta de disponibilidade é indicativa. A validação final deve acontecer novamente ao confirmar a reserva.

### 9.2. Concorrência

Duas requisições podem tentar reservar o mesmo intervalo simultaneamente. Uma checagem em JavaScript antes do `INSERT` não é suficiente.

Implementar:

- Transação de criação.
- Constraint de não sobreposição no PostgreSQL.
- Tratamento específico de erro de constraint.
- Resposta previsível para o usuário: horário acabou de ser reservado; selecione outro.

### 9.3. Fuso horário

- Persistir instantes em UTC usando `timestamptz`.
- Guardar timezone IANA em `Barbershop.timezone`.
- Interpretar horários semanais locais no fuso da barbearia.
- Converter instantes para exibição no fuso configurado.
- Evitar depender do timezone do container/servidor.
- Criar testes de conversão e mudança de horário de verão, mesmo que a configuração brasileira atual não utilize horário de verão.

### 9.4. Regras de status

Fluxo sugerido:

```text
PENDING -> CONFIRMED -> COMPLETED
    |           |
    +-----------+----> CANCELED
    |
    +----------------> CANCELED

CONFIRMED -> NO_SHOW
```

Os status que bloqueiam a agenda devem ser explícitos e cobertos por teste. Recomenda-se `PENDING` e `CONFIRMED` como ocupantes.

---

## 10. Planos comerciais

### 10.1. Proposta inicial de planos

Os limites abaixo são uma proposta para estruturação técnica e deverão ser validados comercialmente antes de publicar preços.

| Plano | Profissionais ativos | Posicionamento inicial |
|---|---:|---|
| Starter | Até 2 | Operação básica da barbearia |
| Professional | Até 5 | Gestão de equipe e relatórios |
| Business | Até 10 | Operação ampliada e relatórios avançados |
| Enterprise | Configurável | Necessidades específicas e condições comerciais próprias |

### 10.2. Funcionalidades

As features devem ser controladas por flags ou permissões vinculadas ao plano, por exemplo:

- `reports_basic`
- `reports_advanced`
- `multiple_managers`
- `professional_schedule`
- `custom_branding`
- `whatsapp_notifications` (futuro)
- `online_payments` (futuro)

Não espalhar verificações de nome do plano em componentes. Criar serviço central de entitlement, por exemplo `canUseFeature(tenant, feature)` e `assertWithinPlanLimit(tenant, resource)`.

### 10.3. Cobrança

A cobrança é fixa por barbearia e por plano. O sistema não calculará fatura por volume de agendamentos ou uso individual no escopo atual.

A integração financeira deve ser desacoplada por interface/adaptador. Gateway e meios de pagamento ainda não foram escolhidos.

---

## 11. Plano de implementação por fases e prioridade

As fases abaixo estão em ordem de dependência técnica. As tasks são numeradas para facilitar a criação de issues no GitHub.

**Legenda:**

- **P0 — Bloqueante:** necessário antes de avançar para funcionalidades dependentes ou produção.
- **P1 — Alta:** necessário para o MVP comercial.
- **P2 — Média:** necessário para operação robusta ou evolução inicial.
- **P3 — Posterior:** fora do primeiro lançamento.

### Fase 0 — Preparação, inventário e baseline

**Objetivo:** preservar o funcionamento atual, criar uma linha de base e preparar ambientes seguros.

| Ordem | ID | Prioridade | Task | Critério de aceite |
|---:|---|---|---|---|
| 1 | BL-001 | P0 | Criar branch de migração `feat/saas-multitenant` a partir da branch estável | Branch criada e protegida; não desenvolver diretamente em `main` |
| 2 | BL-002 | P0 | Clonar e executar o projeto localmente com as versões documentadas | Instalação, lint, testes existentes e build executam sem erro conhecido |
| 3 | BL-003 | P0 | Registrar baseline do schema e exportar diagrama ER atual | Schema atual versionado e diagrama disponível |
| 4 | BL-004 | P0 | Criar banco de homologação com cópia anonimizada ou dataset representativo | Homologação separada de produção e sem dados pessoais desnecessários |
| 5 | BL-005 | P0 | Criar backup testado do PostgreSQL e definir restauração | Backup restaurado em ambiente separado com sucesso |
| 6 | BL-006 | P1 | Inventariar todas as consultas, Server Actions e páginas que acessam `Barbershop`, `User`, `Booking` e `BarbershopService` | Inventário com caminhos de arquivo e riscos de tenant identificados |
| 7 | BL-007 | P1 | Levantar variáveis de ambiente e configurações de deploy atuais | `.env.example` atualizado sem segredos |
| 8 | BL-008 | P1 | Revisar o rate limiting atual baseado em PostgreSQL, incluindo chaves, escopos tenant-aware, fallback em memória e comportamento fail-open | Rate limits testados por tenant/usuário/IP conforme o endpoint; política para falhas documentada; nenhum Redis necessário no MVP |

**Saída da fase:** ambiente reproduzível, backup validado, inventário e estratégia de migração aprovados.

### Fase 1 — Fundação multitenant e schema

**Objetivo:** introduzir as entidades e as relações necessárias sem perder os dados atuais.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-010 | P0 | Definir enums finais de `BarbershopStatus`, `MembershipRole`, `MembershipStatus`, `ProfessionalStatus`, `BookingStatus` e `SubscriptionStatus` | Enums documentados e aprovados | ✅ Concluído |
| 2 | BL-011 | P0 | Adicionar `slug`, `timezone` e `status` em `Barbershop` | Migration aplicada em PostgreSQL local descartável; slug único e timezone default verificados | ✅ Concluído |
| 3 | BL-012 | P0 | Criar `Membership` e campo de papel global em `User` | Usuário pode ter memberships em vários tenants; constraints e índices presentes | ✅ Concluído |
| 4 | BL-013 | P0 | Criar `Professional` independente de `User` | Profissional pode ser cadastrado sem login | ✅ Concluído |
| 5 | BL-014 | P0 | Criar `Customer` independente por `barbershopId` | Mesmo usuário pode ter fichas locais separadas por tenant | ✅ Concluído |
| 6 | BL-015 | P0 | Criar `ProfessionalService` | Relação N:N profissional/serviço com integridade de tenant | ✅ Concluído |
| 7 | BL-016 | P0 | Alterar `Booking` para incluir tenant, cliente, profissional e intervalo | Modelo suporta reservas por profissional e histórico com snapshots | ✅ Concluído |
| 8 | BL-017 | P0 | Criar `ProfessionalSchedule` e `ProfessionalScheduleException` | Jornada individual e exceções podem ser persistidas | ✅ Concluído |
| 9 | BL-018 | P0 | Adaptar `ScheduleBlock` para bloqueio geral ou individual | Bloqueios têm escopo definido e validado | ✅ Concluído |
| 10 | BL-019 | P1 | Criar `Plan` e `Subscription` | Planos e assinaturas associáveis a uma barbearia | ✅ Concluído |
| 11 | BL-020 | P1 | Criar `AuditLog` e eventos de assinatura | Eventos sensíveis podem ser auditados | ✅ Concluído |
| 12 | BL-021 | P0 | Criar chaves únicas, índices e foreign keys compostas tenant-aware | Banco impede referências cruzadas entre tenants nos relacionamentos críticos | ✅ Concluído; FK testada contra booking cross-tenant |
| 13 | BL-022 | P0 | Gerar migrations incrementais e revisar SQL manual | Migrations aplicam em banco vazio local; status e seed verificados | ✅ Concluído localmente; homologação não existe |

**Atenção:** não remover `User.barbershopId`, `User.role`, `Booking.userId` ou `Booking.date` nesta fase. Eles serão mantidos temporariamente para permitir backfill e compatibilidade durante a migração.

**Saída da fase:** schema expandido e migrations seguras, sem quebra funcional da aplicação atual.

### Fase 2 — Backfill e migração de dados

**Objetivo:** converter os dados atuais para o novo modelo.

**Status: não aplicável no estado atual.** O proprietário confirmou que não há produção nem dados a preservar e que o banco é descartável. Não executar backfill; se surgir dado que precise ser mantido, reabrir esta fase antes da migração.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-030 | P0 | Criar script idempotente de migração de `User.barbershopId` para `Membership` | Executar duas vezes não duplica memberships | N/A — sem dados a migrar |
| 2 | BL-031 | P0 | Criar registros `Professional` para usuários atuais que representam equipe | Todos os membros atuais foram classificados e migrados | N/A — sem dados a migrar |
| 3 | BL-032 | P0 | Criar `Customer` por combinação de usuário e barbearia aplicável | Fichas distintas por tenant e sem associação cruzada | N/A — sem dados a migrar |
| 4 | BL-033 | P0 | Criar profissional legado para reservas históricas sem profissional identificável | Histórico antigo permanece consultável e não é atribuído arbitrariamente a profissional real | N/A — sem histórico a preservar |
| 5 | BL-034 | P0 | Migrar bookings para `barbershopId`, `customerId`, `professionalId`, `startsAt`, `endsAt` e snapshots | Todos os registros válidos convertidos; exceções registradas em relatório | N/A — sem dados a migrar |
| 6 | BL-035 | P1 | Criar slugs únicos para barbearias existentes | Todos os tenants existentes possuem slug válido e único | N/A — slugs são gerados no cadastro/seed |
| 7 | BL-036 | P0 | Criar relatório de reconciliação de contagens e órfãos | Contagens antes/depois conciliadas; órfãos tratados ou documentados | N/A — sem dados a migrar |
| 8 | BL-037 | P0 | Executar migração em cópia representativa do banco de produção | Script concluído com log e rollback testado | N/A — não há produção |

**Regras de migração:**

- Não inventar o profissional de agendamentos antigos. Usar profissional legado ou estado histórico explícito.
- Preservar IDs quando tecnicamente possível.
- Preservar status, datas e relações históricas.
- Não fundir fichas `Customer` de tenants diferentes, ainda que tenham mesmo e-mail ou telefone.
- Fazer backup antes de qualquer migração em produção.

**Saída da fase:** não aplicável enquanto não houver dados de produção a preservar.

### Fase 3 — Autenticação, tenant context e autorização

**Objetivo:** retirar a dependência de um único `barbershopId` por usuário e proteger os ambientes.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-038 | P0 | Implementar cadastro autenticado do proprietário | Tenant `PENDING_SETUP`, membership `OWNER` ativo e horários padrão são criados em uma transação; slug reservado e duplicado é recusado | ✅ Concluído; transação validada no PostgreSQL local |
| 2 | BL-039 | P1 | Oferecer autenticação por link verificado enviado por e-mail para proprietários e clientes, mantendo Google | Conta só autentica após consumir token de verificação; configuração SMTP documentada | ✅ Implementado com NextAuth Email Provider e UI para os dois fluxos; SMTP precisa ser configurado no ambiente antes de habilitar |
| 3 | BL-040 | P0 | Refatorar callbacks/sessão do NextAuth para expor identidade, não um único tenant fixo | Sessão não define `barbershopId` como vínculo exclusivo do usuário | ✅ Concluído |
| 4 | BL-041 | P0 | Implementar `resolveTenantBySlug` | Slug válido resolve tenant ativo; slug inválido retorna not found | ✅ Concluído; helper validado com tenant ativo, inativo e slug inválido |
| 5 | BL-042 | P0 | Implementar `requireMembership` | Acesso administrativo exige membership ativo no tenant da URL | ✅ Concluído; layout, páginas e Server Actions por slug; teste cruzado entre tenants |
| 6 | BL-043 | P0 | Implementar `requirePlatformAdmin` | Painel da plataforma exige privilégio global `SUPER_ADMIN` | ✅ Concluído; rota `/painel` protegida e teste para `SUPER_ADMIN`/`NONE` |
| 7 | BL-044 | P0 | Criar helpers de autorização por papel/permissão | `OWNER`, `MANAGER` e `PROFESSIONAL` têm limites de operação testados | ⏳ Em andamento; matriz server-side e guards nas ações implementados; falta agenda restrita ao profissional |
| 8 | BL-045 | P0 | Padronizar leitura/alteração/exclusão tenant-aware | Nenhuma ação administrativa consulta registro apenas pelo ID sem contexto de tenant | ✅ Concluído; mutações e leituras administrativas escopadas pelo contexto validado |
| 9 | BL-046 | P0 | Revisar todas as Server Actions e Route Handlers | Cada operação sensível revalida sessão, membership, tenant e permissão; endpoints aplicáveis utilizam rate limiting com escopo tenant-aware | ⏳ Em andamento; isolamento HTTP validado e layout corrigido; falta auditoria completa dos endpoints |
| 10 | BL-047 | P1 | Implementar fluxo de convite e aceite de membership | Convite expira, é de uso único e cria vínculo no tenant correto | ⏳ Pendente |
| 11 | BL-048 | P1 | Criar testes automatizados de acesso cruzado | Usuário do tenant A não lê, altera ou exclui dados do tenant B | ⏳ Pendente |
| 12 | BL-049 | P2 | Avaliar e implementar PostgreSQL RLS por transação | RLS testada com pool de conexões sem vazamento de contexto | ⏳ Pendente |

**Compatibilidade temporária do BL-038:** o cadastro atualiza `User.barbershopId` para a barbearia recém-criada para compatibilidade com dados/fluxos antigos. A relação `Membership` permanece completa. O painel por slug (`/painel/[slug]`) cobre dashboard, agenda, serviços e configurações; as URLs planas autenticam o vínculo legado e redirecionam para a rota equivalente por slug.

**BL-042 concluído:** `/minhas-barbearias` lista os memberships ativos de cada usuário para seleção da barbearia; o layout e as ações em `/painel/[slug]` autorizam o tenant pelo membership ativo. `/painel` fica reservado ao painel global de `SUPER_ADMIN`. O teste cobre usuário A tentando acessar tenant B. `PENDING_SETUP` é aceito nesse contexto para permitir a configuração inicial.

**BL-043 concluído:** `/painel` chama `requirePlatformAdmin` e retorna 404 sem privilégio global; o helper consulta `User.platformRole` no banco e o teste cobre `SUPER_ADMIN` e `NONE`. A interface funcional do painel permanece para BL-093. **Pendente operacional:** ainda não há fluxo de promoção de usuário a `SUPER_ADMIN`; o campo fica `NONE` por padrão e precisa ser atribuído manualmente até existir processo administrativo seguro.

**BL-044 em andamento:** matriz inicial server-side: `OWNER` pode operar tudo; `MANAGER` pode operar agenda, serviços e atendimentos, mas não configurações da barbearia; `PROFESSIONAL` não recebe acesso ao painel tenant-wide enquanto consultas não forem filtradas por profissional. As Server Actions administrativas já verificam a permissão correspondente. Falta implementar e testar a agenda isolada do profissional antes de liberar esse papel.

**BL-045 concluído:** revisão das mutações no painel confirmou filtros por `barbershopId` nas atualizações/exclusões de serviços, agendamentos e bloqueios. A exclusão de serviço passou a usar `id + barbershopId`, evitando excluir por ID após uma validação separada. Leituras administrativas usam o tenant fornecido pelo contexto autorizado. A atualização de onboarding por `userId` é pessoal, não uma mutação de entidade do tenant.

**BL-046 em andamento:** Server Actions administrativas exigem `slug` e validam membership/permissão; omitir o slug nega a operação. URLs planas autenticam o vínculo legado e redirecionam para `/painel/[slug]`. `deleteBooking` apaga por `id + userId`; `updateOwnPhone` grava apenas no usuário autenticado. Mutations e leituras de reservas têm rate limit por usuário; consultas de horários validam ID/data e só usam serviços de tenants ativos. Teste HTTP com sessão NextAuth real confirmou acesso ao tenant A e redirect para `/?erro=acesso-negado` no tenant B; a resposta B não contém shell nem dados do tenant A. A sessão e os fixtures locais do smoke test foram removidos. Falta concluir a auditoria dos endpoints antes de fechar BL-046.

**Ponte de compatibilidade das rotas planas:** `requireBarbershopAdmin` permanece somente na entrada das URLs antigas para localizar o tenant legado e redirecionar; mutações administrativas não têm fallback para esse guard. A remoção das URLs planas será avaliada na revisão geral do BL-046.

**BL-041:** `resolveTenantBySlug` está implementado em `app/_lib/tenant/resolve-tenant.ts`; ainda não está conectado às rotas públicas ou administrativas.

**Saída da fase:** identidade global, memberships por tenant e autorização centralizada e testada.

**BL-039 operacional:** habilitar `NEXT_PUBLIC_EMAIL_SIGN_IN_ENABLED=true` somente junto com `EMAIL_SERVER` e `EMAIL_FROM` configurados. O provedor só é registrado quando os três valores existem; sem SMTP, o login Google continua disponível. A opção de e-mail aparece no login de cliente e no acesso ao cadastro de barbearia. Os links de verificação dependem do serviço SMTP do ambiente.

### Fase 4 — Cadastro e gestão de profissionais

**Objetivo:** disponibilizar equipe com cadastro independente e permissões opcionais.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-050 | P0 | Criar CRUD de profissionais | OWNER/MANAGER gerenciam profissionais do próprio tenant | ✅ Concluído |
| 2 | BL-051 | P0 | Criar associação de profissionais a serviços | Serviço só aparece para profissionais habilitados | ✅ Concluído |
| 3 | BL-052 | P0 | Implementar jornada semanal individual | Profissional pode ter um ou mais intervalos por dia | ✅ Concluído |
| 4 | BL-053 | P1 | Implementar folgas, férias e exceções | Exceções prevalecem conforme regra documentada | ✅ Concluído |
| 5 | BL-054 | P1 | Implementar bloqueios gerais e individuais | Bloqueio individual não afeta outros profissionais; geral afeta todos | ✅ Concluído |
| 6 | BL-055 | P1 | Implementar convite de profissional para criar/acessar conta | Profissional vincula conta sem ganhar acesso a outro tenant | ⏳ Pendente |
| 7 | BL-056 | P1 | Implementar limite de profissionais por plano no backend | Não é possível exceder limite por requisição concorrente | ⏳ Pendente |
| 8 | BL-057 | P1 | Criar tela de equipe no painel | Cadastro, edição, ativação, desativação e associação a serviços funcionam | ✅ Concluído |

**Saída da fase:** barbearia gerencia sua equipe e cada profissional possui calendário próprio.

**BL-050 concluído:** OWNER/MANAGER podem cadastrar, editar, ativar e desativar profissionais no tenant autorizado; registros não são excluídos e preservam o histórico. **BL-057 concluído:** a tela `/painel/[slug]/team` lista status e serviços associados e permite gerenciar a equipe. A edição valida que os serviços pertencem ao tenant; associações já usadas por agendamentos não podem ser removidas para preservar o histórico. **BL-051 concluído:** a associação de serviços é gerenciável no painel e os fluxos de consulta e criação de agendamentos filtram profissionais pelos serviços habilitados. **BL-052 concluído:** OWNER/MANAGER podem configurar múltiplos intervalos semanais por profissional, com validação de horário e sobreposição e isolamento por tenant; a jornada individual já é aplicada ao cálculo de disponibilidade e à criação de reservas. **BL-053 concluído:** OWNER/MANAGER podem cadastrar e remover exceções de indisponibilidade ou horário especial por data, inclusive correções históricas; gravações da mesma data/tipo substituem as anteriores, com limite de 100 exceções por profissional e isolamento por tenant. As exceções já são consideradas na disponibilidade e na validação da reserva. **BL-054 concluído:** o painel cria bloqueios gerais ou vinculados a um profissional, mostra o escopo e valida o profissional dentro do tenant autorizado; a exclusão é tenant-scoped e a disponibilidade considera bloqueios gerais e individuais. A conversão de horários locais respeita o timezone IANA: horários inexistentes no avanço do horário de verão são descartados e, em horários repetidos no retorno, é escolhida a primeira ocorrência. Convites e limites por plano (BL-055–056) permanecem pendentes.

### Fase 5 — Motor de agendamento multi-profissional

**Objetivo:** corrigir o mecanismo atual e garantir reservas simultâneas sem conflitos indevidos.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-060 | P0 | Definir regra de disponibilidade e status ocupantes | Regras documentadas e cobertas por testes | ✅ Concluído |
| 2 | BL-061 | P0 | Criar serviço de cálculo de disponibilidade por profissional | Considera jornada, horário do tenant, serviço, bloqueios, reservas e timezone | ✅ Concluído |
| 3 | BL-062 | P0 | Adaptar consulta `getUnavailableIntervals` | Consulta a agenda do profissional escolhido | ✅ Concluído |
| 4 | BL-063 | P0 | Refatorar `createBooking` para validar tenant, cliente, serviço e profissional | Relações tenant-scoped validadas | 🟡 Parcial — customerId fica nullable quando ainda não existe ficha local |
| 5 | BL-064 | P0 | Implementar `startsAt` e `endsAt` e snapshots de preço/duração | Histórico preservado | ✅ Concluído |
| 6 | BL-065 | P0 | Criar constraint PostgreSQL de não sobreposição | Migration criada e aplicada; teste concorrente em PostgreSQL | 🟡 Parcial — migration criada, não aplicada; sem teste concorrente PostgreSQL |
| 7 | BL-066 | P0 | Tratar erro de conflito de banco | Retorno amigável implementado e integração concorrente | 🟡 Parcial — tratamento implementado; integração concorrente pendente |
| 8 | BL-067 | P1 | Implementar opção “qualquer profissional disponível” | Sistema seleciona apenas profissional apto e com intervalo livre | ⏳ Pendente |
| 9 | BL-068 | P1 | Adaptar cancelamento e alteração de agendamento | Cancelamento do cliente preserva o registro; alterações mais amplas | 🟡 Parcial — cancelamento preserva histórico; transições e alterações mais amplas pendentes |
| 10 | BL-069 | P1 | Revisar calendário do painel para múltiplos profissionais | Agenda permite filtrar/visualizar por profissional e por dia | ⏳ Pendente |
| 11 | BL-070 | P0 | Criar testes de concorrência, duração e timezone | Testes provam ausência de sobreposição e conversão correta de horário | 🟡 Parcial — testes unitários de timezone/sobreposição; concorrência no banco não executada |

**Saída da fase (após aplicar a migration BL-065):** profissionais podem atender simultaneamente e o banco impede conflito de agenda.

**BL-060–066 (implementação):** somente `PENDING` e `CONFIRMED` ocupam agenda; `CANCELED`, `COMPLETED` e `NO_SHOW` não. A disponibilidade intersecta jornada do tenant e do profissional, aplica exceções (indisponibilidade prevalece; horário customizado substitui a jornada semanal), bloqueios gerais/individuais e reservas. Datas/horários são interpretados no timezone IANA do tenant; em uma hora local repetida no fim do horário de verão escolhe-se a primeira ocorrência, e horários locais inexistentes são descartados. A consulta e a criação filtram serviços/profissionais habilitados; a criação revalida serviço/profissional/tenant e horário e grava snapshots. `customerId` só é preenchido se já existir um Customer ligado ao usuário naquele tenant; caso contrário permanece nullable. A criação automática da ficha e o vínculo de reservas sem `customerId` continuam pendentes (BL-082). A migration da constraint e o teste concorrente ainda precisam ser verificados em um PostgreSQL descartável; não foram executados nesta implementação.

**BL-068 (implementação):** o cliente pode cancelar apenas bookings próprios `PENDING`/`CONFIRMED`; a operação preserva o registro e snapshots e marca `CANCELED`, mantendo o histórico de cancelamento. A listagem futura omite cancelados e a interface não os oferece como confirmados/canceláveis. O caminho de equipe continua tenant-scoped, mas validação de transições de status e alterações mais amplas do cliente/equipe permanecem pendentes.

### Fase 6 — Perfil público, clientes e remoção do marketplace

**Objetivo:** entregar a experiência individual de cada estabelecimento.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-080 | P0 | Implementar página pública `/{slug}` | Exibe somente dados públicos do tenant resolvido | ✅ Concluído |
| 2 | BL-081 | P0 | Implementar fluxo de agendamento sob `/{slug}/agendar` | Todo o fluxo preserva o tenant resolvido | ✅ Concluído |
| 3 | BL-082 | P0 | Criar/consultar Customer por tenant | Cliente possui ficha local independente; vinculada por `barbershopId + userId`, sem associação por e-mail | ✅ Concluído |
| 4 | BL-083 | P0 | Implementar área `/{slug}/minha-conta` | Cliente vê somente seus dados e bookings daquele tenant | ✅ Concluído |
| 5 | BL-084 | P0 | Remover busca/listagem pública de barbearias | Não há rota ou componente público para descobrir outros estabelecimentos | ⏳ Pendente |
| 6 | BL-085 | P1 | Remover links, cards, filtros e conteúdo de marketplace | Navegação não sugere concorrentes nem redireciona para catálogo | ⏳ Pendente |
| 7 | BL-086 | P1 | Implementar gestão de perfil público no painel | Proprietário altera dados, fotos, horários e slug conforme regras | ⏳ Pendente |
| 8 | BL-087 | P1 | Implementar metadados/SEO por barbearia | Cada slug tem title, description e canonical adequados | ✅ Concluído |
| 9 | BL-088 | P1 | Revisar responsividade e acessibilidade do fluxo | Agendamento funciona em dispositivos móveis e desktop | ⏳ Pendente |

**Andamento:** BL-080, BL-081, BL-082, BL-083 e BL-087 concluídos. A página Customer por tenant e a área `/{slug}/minha-conta` estão implementadas. A remoção do marketplace (BL-084/085) continua pendente; portanto, a saída da fase ainda não foi atingida. O agendamento associa `customerId` somente quando já existe ficha local; criar/associar a ficha automaticamente durante o booking e vincular agendamentos antigos sem `customerId` continuam pendentes.

### Fase 7 — Planos, assinaturas e administração da plataforma

**Objetivo:** tornar a operação comercial administrável.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-090 | P0 | Criar cadastro e edição de planos | Superadmin define preço, limites e funcionalidades | ✅ Concluído; CRUD protegido, validação server-side e auditoria |
| 2 | BL-091 | P0 | Criar assinatura vinculada ao tenant | Barbearia possui plano e status verificáveis | ✅ Concluído; atribuição manual de plano/status e período pelo superadmin |
| 3 | BL-092 | P0 | Criar serviço central de entitlements/limites | Backend valida limites e features sem depender da UI | ✅ Concluído para as capacidades implementadas; feature `professional_schedule` e limite de profissionais verificados no servidor |
| 4 | BL-093 | P0 | Criar painel de superadmin | Acesso restrito a usuários com `SUPER_ADMIN` | ✅ Concluído; entrada protegida para as gestões da plataforma |
| 5 | BL-094 | P1 | Criar gestão de barbearias | Superadmin ativa, suspende e consulta tenants | ✅ Concluído; painel global de consulta com ativação/suspensão auditadas |
| 6 | BL-095 | P1 | Criar gestão de assinaturas | Superadmin altera plano/status com auditoria | ✅ Concluído; mudanças auditadas e troca de plano preserva assinatura anterior cancelada |
| 7 | BL-096 | P1 | Implementar período de teste e período de tolerância | Transições são automáticas/configuráveis e testadas | 🟡 Parcial — endpoint de scheduler protegido disponível; falta configurar chamada periódica na infraestrutura |
| 8 | BL-097 | P1 | Criar interface/adaptador do gateway de pagamento | Domínio não depende diretamente do SDK do provedor | ⏳ Pendente |
| 9 | BL-098 | P1 | Implementar webhooks idempotentes quando o gateway for escolhido | Evento duplicado não duplica cobrança ou mudança de status | ⏳ Pendente |
| 10 | BL-099 | P1 | Implementar tela de assinatura para proprietário | Proprietário visualiza plano, status, datas e instruções de pagamento | ✅ Concluído; página restrita a OWNER e instruções manuais configuráveis por ambiente |

**Saída da fase:** plataforma consegue administrar planos, limites e status de seus clientes SaaS.

**Andamento:** BL-090 concluído com gestão manual de planos em `/painel/planos`; alterações e ativações são registradas em `AuditLog`. BL-091/095 concluídos com gestão manual em `/painel/assinaturas`, snapshots de preço, histórico de plano e auditoria. BL-092 concluído para as capacidades implementadas: serviço central resolve entitlements; limite de profissionais é aplicado em criação/reativação e downgrade; jornadas e exceções exigem a feature `professional_schedule`. BL-093 concluído: `/painel` é restrito a `SUPER_ADMIN` e centraliza acesso às gestões da plataforma. BL-094 concluído com consulta de tenants em `/painel/barbearias` e ativação/suspensão auditadas. BL-096 parcialmente implementado: trial (padrão 14 dias) e tolerância (padrão 7 dias) configuráveis via `SUBSCRIPTION_TRIAL_DAYS`/`SUBSCRIPTION_GRACE_DAYS`; `TRIALING`/`ACTIVE` expira para `PAST_DUE`, depois `SUSPENDED`, ao acessar assinatura/agendamento e via `POST /api/cron/subscriptions`. Transições registram `SubscriptionEvent`; falta configurar a chamada periódica na infraestrutura, com `SUBSCRIPTION_CRON_SECRET`. BL-099 concluído: somente `OWNER` consulta plano, status, preço contratado, período e instruções manuais em `/painel/{slug}/assinatura`; configure `MANUAL_PAYMENT_INSTRUCTIONS`. Uma migration adiciona unicidade parcial para assinatura não cancelada por barbearia; **não foi aplicada nem testada em PostgreSQL**. BL-097/098 permanecem pendentes até definição do gateway, que não é necessário para o fluxo manual atual.

### Fase 8 — Testes finais, deploy e operação

**Objetivo:** homologar segurança, integridade e estabilidade antes de vender.

| Ordem | ID | Prioridade | Task | Critério de aceite | Status |
|---:|---|---|---|---|---|
| 1 | BL-100 | P0 | Executar suíte de testes unitários e integração | Testes essenciais passam em CI | 🟡 Parcial — testes unitários disponíveis e workflow de CI configurado; testes de integração completos ausentes e execução no GitHub não verificada |
| 2 | BL-101 | P0 | Executar matriz de testes de isolamento A/B | Nenhum acesso cruzado em leitura, escrita, update, delete e arquivos | ⏳ Pendente |
| 3 | BL-102 | P0 | Executar testes de concorrência de agendamento | Banco rejeita reservas conflitantes | 🟡 Parcial — testes unitários de timezone/sobreposição; teste concorrente PostgreSQL não executado |
| 4 | BL-103 | P0 | Testar migração de banco em cópia atualizada | Sem perda ou associação indevida de dados | ⏳ Pendente |
| 5 | BL-104 | P0 | Testar fluxo de cadastro, convite, agendamento, cancelamento e suspensão | Fluxos completos aprovados | ⏳ Pendente |
| 6 | BL-105 | P1 | Configurar CI para lint, typecheck, testes e build | Pull requests bloqueados em falhas críticas | 🟡 Parcial — workflow configurado para PRs e pushes em `main`/`dev`; branch protection e execução no GitHub não verificadas |
| 7 | BL-106 | P1 | Configurar deploy Docker e Traefik | HTTPS, health check e rollback documentados | ⏳ Pendente |
| 8 | BL-107 | P1 | Configurar backup automatizado e política de retenção | Restauração testada e procedimento registrado | ⏳ Pendente |
| 9 | BL-108 | P1 | Configurar monitoramento e logs | Erros de aplicação, banco e processos assíncronos existentes observáveis; preparar métricas para avaliar necessidade futura de Redis | ⏳ Pendente |
| 10 | BL-109 | P1 | Revisar LGPD, termos, privacidade e retenção | Documentos e processos revisados antes do lançamento | ⏳ Pendente |
| 11 | BL-110 | P1 | Executar piloto com duas ou mais barbearias independentes | Teste real comprova isolamento, agenda e operação comercial | ⏳ Pendente |

**Nota:** critérios dependentes de produção, homologação ou banco PostgreSQL não foram verificados.

**Saída da fase:** primeira versão comercial homologada e operacional.

---

## 12. Dependências e caminho crítico

A ordem técnica recomendada é:

```text
Preparação e backup
        |
        v
Schema multitenant
        |
        v
Backfill e reconciliação
        |
        v
Autenticação + Membership + Tenant Context
        |
        +--------------------------+
        |                          |
        v                          v
Gestão de profissionais      Perfil público por slug
        |                          |
        v                          |
Motor de agenda individual <-------+
        |
        v
Clientes locais + experiência de agendamento
        |
        v
Planos + assinaturas + painel da plataforma
        |
        v
Testes de isolamento + homologação + produção
```

Não iniciar o desenvolvimento do painel comercial antes de estabilizar o tenant context e as regras de autorização. Não liberar agendamentos multi-profissionais antes de implementar a proteção contra concorrência no banco.

---

## 13. Estratégia de testes e critérios globais de aceite

### 13.1. Isolamento de tenants

Criar no mínimo dois tenants de teste: A e B.

Para cada entidade tenant-owned (`Customer`, `Professional`, `Service`, `Booking`, `ScheduleBlock`, `OpeningHour`, `Subscription` e arquivos), validar:

- Tenant A não lista registros do tenant B.
- Tenant A não consulta registro do tenant B por ID.
- Tenant A não edita registro do tenant B.
- Tenant A não exclui registro do tenant B.
- Tenant A não consegue associar seu cliente a serviço/profissional de B.
- Alterar o slug na URL não concede acesso administrativo.
- Um usuário com membership em A e B só acessa o tenant selecionado e autorizado.
- Um usuário sem membership não acessa painéis.

### 13.2. Agendamento

- Dois profissionais diferentes podem ter bookings simultâneos.
- Um profissional não pode ter bookings sobrepostos.
- A duração correta determina o intervalo ocupado.
- Serviço não associado ao profissional não pode ser agendado com ele.
- Profissional inativo não recebe nova reserva.
- Bloqueio individual não impede reserva de outro profissional.
- Bloqueio geral impede reservas de todos os profissionais no intervalo.
- Booking cancelado libera intervalo conforme regra de status.
- Duas requisições concorrentes não conseguem confirmar o mesmo profissional/intervalo.
- Alteração posterior de preço/duração não altera snapshot histórico.

### 13.3. Clientes

- O mesmo e-mail em duas barbearias gera fichas locais independentes.
- Histórico da Barbearia A não aparece na Barbearia B.
- Observações internas nunca aparecem no perfil público nem em outro tenant.
- Cliente vê apenas os agendamentos da barbearia em cujo contexto está navegando.

### 13.4. Planos

- Plano Starter não ativa terceiro profissional.
- Upgrade permite aumento de limite conforme política definida.
- Downgrade não apaga profissionais ou histórico automaticamente.
- Assinatura suspensa impede novas operações definidas pela política comercial, mas preserva dados.
- Webhook duplicado não gera mudança duplicada.

### 13.5. Critério global de conclusão

O MVP somente será considerado pronto quando:

1. Duas ou mais barbearias estiverem operando no mesmo ambiente compartilhado.
2. Não existir busca pública ou marketplace.
3. Cada barbearia tiver slug e perfil próprio.
4. Cada barbearia puder ter vários profissionais.
5. Agendamentos simultâneos em profissionais diferentes funcionarem.
6. Conflitos de agenda forem impedidos no banco.
7. Clientes e históricos estiverem isolados por tenant.
8. Papéis e permissões estiverem validados no servidor.
9. Planos fixos e seus limites forem aplicados no backend.
10. Migração, backup e restauração forem testados.
11. Testes de isolamento entre tenants passarem.

---

## 14. Migração e publicação em produção

A migração deverá seguir abordagem **expand-and-contract**.

### 14.1. Antes da migração

- Congelar alterações estruturais não relacionadas.
- Criar backup completo do PostgreSQL.
- Confirmar que o backup pode ser restaurado.
- Fazer snapshot/backup dos arquivos do MinIO.
- Criar cópia de homologação atualizada.
- Executar backfill em homologação e conferir relatórios.

### 14.2. Execução

1. Aplicar migrations aditivas (novas tabelas/colunas e índices).
2. Executar scripts idempotentes de backfill.
3. Validar constraints e relacionamentos.
4. Publicar aplicação que lê o novo modelo.
5. Monitorar erros de autenticação, reservas e queries.
6. Manter campos antigos durante janela de estabilização.
7. Remover campos e código legado somente em migration posterior, após confirmação.

### 14.3. Rollback

- Manter imagem da aplicação anterior.
- Manter backup anterior ao deploy.
- Não executar drop de colunas antigas no mesmo release do backfill.
- Documentar como restaurar banco e MinIO.
- Em caso de inconsistência, suspender novas reservas antes de tentar correção manual.

---

## 15. Configuração de ambiente e deploy

A lista final deve ser validada no código; abaixo estão as variáveis conceituais esperadas.

```dotenv
NODE_ENV=production
NEXTAUTH_URL=https://seudominio.com.br
NEXT_AUTH_SECRET=... 

DATABASE_URL=postgresql://...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=barberlab

# Gateway de pagamento, quando escolhido
PAYMENT_PROVIDER=...
PAYMENT_WEBHOOK_SECRET=...
```

Requisitos de infraestrutura:

- Docker para empacotamento e deploy.
- Traefik para HTTPS e roteamento do domínio principal.
- PostgreSQL com backup automatizado.
- MinIO com persistência e política de backup.
- Não provisionar Redis no MVP. O rate limiting utilizará PostgreSQL e a implementação atual de `rate-limiter-flexible`.
- Logs estruturados e health checks.
- Não definir `REDIS_URL` nem adicionar serviço Redis ao Docker Compose do MVP.
- Segredos exclusivamente em variáveis protegidas do ambiente de deploy.

Como o acesso escolhido utiliza paths, não é necessário wildcard DNS nem certificado individual por barbearia.

---

## 16. Estimativa de esforço

A estimativa é inicial e depende da qualidade do código local, da quantidade de telas afetadas, de testes existentes e do volume de dados atuais.

| Fase | Estimativa inicial |
|---|---:|
| Preparação e inventário | 1–2 dias úteis |
| Fundação multitenant e schema | 3–4 dias úteis |
| Backfill e migração | 2–3 dias úteis |
| Autenticação e autorização | 4–5 dias úteis |
| Profissionais e equipe | 3–4 dias úteis |
| Motor de agendamento | 4–6 dias úteis |
| Perfil público e clientes | 2–3 dias úteis |
| Planos e painel SaaS | 3–4 dias úteis |
| Testes finais e deploy | 3–5 dias úteis |

**Estimativa consolidada de planejamento:** aproximadamente **25–36 dias úteis** para um desenvolvedor com familiaridade com a stack, com possibilidade de variação conforme os ajustes descobertos na execução. A estimativa anterior de 24–34 dias úteis deve ser tratada como referência preliminar; a decomposição detalhada acima acrescenta explicitamente preparação e migração de dados.

A integração completa com gateway de pagamento pode acrescentar aproximadamente 3–5 dias úteis ou mais, dependendo do provedor, checkout, recorrência, webhooks e regras de inadimplência.

A estimativa não inclui espera por aprovação de contas de terceiros, negociação comercial, produção de conteúdo ou suporte operacional após lançamento.

---

## 17. Decisões ainda pendentes antes do desenvolvimento de cada módulo

As decisões abaixo não alteram a arquitetura principal, mas precisam ser fechadas antes da implementação correspondente.

| Tema | Proposta padrão | Quando decidir |
|---|---|---|
| Gateway de pagamento | Manter adaptador desacoplado e iniciar com gestão manual de assinatura | Antes da Fase 7, se cobrança automática fizer parte do MVP |
| Agendamento sem login | Manter autenticação obrigatória no primeiro MVP, pois o sistema atual já exige login | Antes da Fase 6 |
| Login de clientes | Manter identidade global e ficha `Customer` isolada por tenant | Antes da Fase 3 |
| Cancelamento | Definir prazo, política e status ocupantes de agenda | Antes da Fase 5 |
| Política de atraso | Período de tolerância configurável antes de suspender tenant | Antes da Fase 7 |
| Preço por profissional | Preço padrão do serviço no MVP; permitir override em versão futura | Antes da Fase 4, caso seja requisito comercial |
| Intervalo entre atendimentos | Sem intervalo adicional por padrão; permitir configuração futura | Antes da Fase 5 |
| Limites finais dos planos | Starter 2, Professional 5, Business 10; valores comerciais ainda não definidos | Antes de publicar `/precos` |
| Política de retenção e exclusão | Definir prazos e processo compatível com LGPD | Antes da produção |

---

## 18. Recomendação final e ordem imediata de execução

A primeira entrega não deve ser uma mudança visual. Deve ser a fundação de dados e segurança.

Ordem imediata recomendada:

1. Criar branch e homologação, documentar baseline e testar backup.
2. Finalizar modelo relacional alvo e migration strategy.
3. Implementar `Membership`, `Professional`, `Customer` e as novas relações de `Booking`.
4. Fazer backfill em homologação e conciliar todos os registros.
5. Refatorar autenticação e criar tenant context/authorization helpers.
6. Implementar equipe e agenda individual.
7. Reescrever o fluxo de reserva e implementar a constraint de não sobreposição.
8. Publicar perfis por slug e remover marketplace.
9. Implementar planos e painel de superadmin.
10. Executar matriz completa de isolamento, homologar e publicar.

**Decisão arquitetural central:** o BarberLab deve evoluir para um monólito modular SaaS, com PostgreSQL compartilhado, isolamento lógico por tenant, identidade global de autenticação e dados de clientes separados por barbearia. O perfil público é acessado por slug, não existe descoberta de concorrentes, e a agenda é controlada por profissional.

---

## 19. Redis e processamento assíncrono — evolução futura (fora do MVP)

A adoção de Redis está explicitamente **adiada**. Não faz parte da infraestrutura mínima, do deploy inicial nem dos critérios de aceite do MVP. A primeira versão deverá funcionar sem Redis, utilizando PostgreSQL para dados, transações e rate limiting.

### 19.1. Critérios para reconsiderar Redis

Reavaliar a adoção somente quando pelo menos uma necessidade operacional for demonstrada por métricas ou requisitos de produto, por exemplo:

- Rate limiting precisa ser consistente entre múltiplas instâncias da aplicação e a solução PostgreSQL passa a representar custo ou contenção relevante.
- Consultas repetidas e mensuradas de dados públicos justificam cache, com TTL e política de invalidação claros.
- O volume de notificações, e-mails, mensagens ou lembretes exige processamento assíncrono confiável.
- Tarefas agendadas, retentativas e controle de concorrência de workers passam a exigir uma fila dedicada.

Não adotar Redis apenas por previsão de escala ou por fazer parte de uma stack comum de SaaS. Antes da decisão, medir latência, volume de consultas, carga do PostgreSQL e frequência de tarefas assíncronas.

### 19.2. Possíveis usos futuros

| Uso futuro | Possível implementação | Observações |
|---|---|---|
| Filas e workers | Redis + BullMQ | Worker separado do processo web; retentativas, backoff, idempotência e monitoramento de filas |
| Notificações | BullMQ | Confirmações, lembretes, avisos para profissionais e mensagens transacionais |
| Rate limiting distribuído | Redis + `rate-limiter-flexible` ou solução equivalente | Adotar apenas se o PostgreSQL deixar de atender bem ao perfil de carga |
| Cache | Redis | Apenas leituras adequadas a cache; chaves sempre tenant-aware e invalidação definida |
| Locks temporários | Redis, quando justificado | Não substituir constraints, transações ou integridade do PostgreSQL |

### 19.3. Requisitos para a futura implementação

1. Criar um serviço/worker independente da aplicação Next.js para consumir tarefas, sem bloquear requisições web.
2. Garantir idempotência para notificações e webhooks, evitando duplicidade em retentativas.
3. Considerar o padrão Transactional Outbox para não perder eventos entre a gravação do agendamento no PostgreSQL e a publicação na fila.
4. Definir política de retentativas, dead-letter/fila de falhas, observabilidade e procedimento de reprocessamento.
5. Nunca considerar Redis como fonte de verdade de clientes, serviços, pagamentos ou agendamentos.
6. Manter a confirmação de disponibilidade e a prevenção de conflitos no PostgreSQL, com transações e constraints.
7. Isolar chaves e dados de cache por `barbershopId`, sem permitir vazamento de dados entre tenants.
8. Provisionar senha, rede privada, persistência apropriada, limites de memória, política de eviction e monitoramento antes de produção.
9. Adicionar `REDIS_URL` somente na fase em que Redis for efetivamente introduzido; não manter variável vazia no `.env.example` do MVP.

### 19.4. Backlog futuro sugerido (não bloqueia o lançamento)

| Ordem | ID futuro | Prioridade | Task | Critério de aceite |
|---:|---|---|---|---|
| 1 | BL-FUT-001 | P3 | Medir carga e identificar gargalos que justifiquem Redis | Relatório com métricas, baseline e justificativa técnica aprovada |
| 2 | BL-FUT-002 | P3 | Definir arquitetura de filas, worker e Transactional Outbox | Fluxos, garantias de entrega, retentativas e idempotência documentados |
| 3 | BL-FUT-003 | P3 | Provisionar Redis e monitoramento em ambiente de homologação | Acesso privado, autenticação, persistência/eviction e alertas configurados |
| 4 | BL-FUT-004 | P3 | Implementar worker BullMQ para notificações e lembretes | Jobs processados sem bloquear agendamento; falhas podem ser reprocessadas |
| 5 | BL-FUT-005 | P3 | Avaliar migração de rate limiting/cache para Redis | Testes de consistência distribuída e ganho mensurável; PostgreSQL permanece fonte da verdade |

**Regra de escopo:** nenhuma task BL-FUT-* é pré-requisito para o MVP. O deploy inicial não deve instalar Redis, declarar `REDIS_URL` ou depender de BullMQ.

---

## 20. Referências do projeto

- Repositório: https://github.com/LuanPaD/BarberLab
- README: https://github.com/LuanPaD/BarberLab/blob/main/README.md
- Schema Prisma: https://github.com/LuanPaD/BarberLab/blob/main/prisma/schema.prisma
- Ação de criação de agendamento: https://github.com/LuanPaD/BarberLab/blob/main/app/_actions/create-booking.ts
- Consulta de indisponibilidade: https://github.com/LuanPaD/BarberLab/blob/main/app/_actions/get-bookings.ts
- Listagem de barbearias: https://github.com/LuanPaD/BarberLab/blob/main/app/%28customer%29/barbershops/page.tsx
- Next.js — Dynamic Routes: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
- Prisma — Composite IDs and constraints: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints
- PostgreSQL — Range Types: https://www.postgresql.org/docs/current/rangetypes.html
- PostgreSQL — Exclusion Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION
