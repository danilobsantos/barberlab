import { savePlatformSubscription } from "@/app/_actions/platform-subscriptions"
import { Button } from "@/app/_components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import { subscriptionTrialDays } from "@/app/_lib/platform/subscription-lifecycle"
import { SubscriptionStatus } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { withPlatformContext } from "@/app/_lib/database-context"

export const metadata = {
  title: "Assinaturas | Barber Lab",
  robots: { index: false, follow: false },
}

const statuses = Object.values(SubscriptionStatus)

const asDateInput = (date?: Date) =>
  date?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10)

const trialEnd = () => {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + subscriptionTrialDays)
  return asDateInput(date)
}

export default async function PlatformSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const admin = await requirePlatformAdmin()
  if (!admin) notFound()
  const params = await searchParams
  const [barbershops, plans] = await withPlatformContext(admin.userId, (tx) =>
    Promise.all([
      tx.barbershop.findMany({
        orderBy: { name: "asc" },
        include: {
          subscriptions: {
            where: { status: { not: "CANCELED" } },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { plan: true },
          },
        },
      }),
      tx.plan.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]),
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-5 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-primary text-sm font-semibold">
            BARBER LAB · PLATAFORMA
          </p>
          <h1 className="text-3xl font-semibold">Assinaturas</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/painel">Painel</Link>
        </Button>
      </header>

      {params.error === "invalid" && (
        <p role="alert">Barbearia, plano ou período inválido.</p>
      )}
      {params.error === "limit" && (
        <p role="alert">
          O plano escolhido tem limite inferior ao número de profissionais
          ativos.
        </p>
      )}
      {params.error === "conflict" && (
        <p role="alert">
          A assinatura mudou em outra operação. Atualize a página e tente
          novamente.
        </p>
      )}
      {params.saved && <p role="status">Assinatura atualizada.</p>}

      {barbershops.length === 0 && <p>Nenhuma barbearia cadastrada.</p>}
      {plans.length === 0 && (
        <p role="alert">
          Cadastre ao menos um plano ativo antes de atribuir assinaturas.
        </p>
      )}
      <section className="grid gap-4">
        {barbershops.map((shop) => {
          const current = shop.subscriptions[0]
          const availablePlans =
            current && !current.plan.isActive ? [current.plan, ...plans] : plans
          return (
            <Card key={shop.id}>
              <CardHeader>
                <CardTitle>{shop.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  /{shop.slug} · {shop.status}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  {current
                    ? `${current.plan.name} · ${current.status} · R$ ${current.priceAtSubscription.toString()}/mês`
                    : "Sem assinatura vigente"}
                </p>
                {availablePlans.length > 0 && (
                  <form
                    action={savePlatformSubscription}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    <input type="hidden" name="barbershopId" value={shop.id} />
                    <label className="grid gap-1 text-sm">
                      Plano
                      <select
                        name="planId"
                        required
                        defaultValue={current?.planId ?? ""}
                        className="border-input bg-background h-9 rounded-md border px-3"
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {availablePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                            {plan.isActive ? "" : " (inativo)"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      Status
                      <select
                        name="status"
                        required
                        defaultValue={current?.status ?? "TRIALING"}
                        className="border-input bg-background h-9 rounded-md border px-3"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      Início do período
                      <Input
                        name="currentPeriodStart"
                        type="date"
                        required
                        defaultValue={asDateInput(current?.currentPeriodStart)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Fim do período
                      <Input
                        name="currentPeriodEnd"
                        type="date"
                        required
                        defaultValue={
                          current
                            ? asDateInput(current.currentPeriodEnd)
                            : trialEnd()
                        }
                      />
                    </label>
                    <div className="flex items-end">
                      <Button type="submit">Salvar assinatura</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )
        })}
      </section>
    </main>
  )
}
