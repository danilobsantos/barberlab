import { Button } from "@/app/_components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { db } from "@/app/_lib/prisma"
import { refreshSubscriptionLifecycle } from "@/app/_lib/platform/subscription-lifecycle"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Assinatura | Barber Lab",
  robots: { index: false, follow: false },
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date)

const paymentInstructions = process.env.MANUAL_PAYMENT_INSTRUCTIONS?.trim()

export default async function TenantSubscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = await requireAdminContext(slug, "manageSettings")
  if (!admin || admin.role !== "OWNER") notFound()

  await refreshSubscriptionLifecycle(admin.barbershopId)
  const subscription = await db.subscription.findFirst({
    where: { barbershopId: admin.barbershopId, status: { not: "CANCELED" } },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  })

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-5 lg:px-8 lg:py-10">
      <header className="space-y-3">
        <Button asChild variant="ghost" className="-ml-3 w-fit">
          <Link href={`/painel/${slug}/settings`}>
            <ArrowLeftIcon />
            Voltar às configurações
          </Link>
        </Button>
        <div>
          <p className="text-primary text-sm font-semibold">
            CONTA DA BARBEARIA
          </p>
          <h1 className="text-3xl font-semibold">Assinatura</h1>
        </div>
      </header>

      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle>{subscription.plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{subscription.plan.description}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Status</dt>
                <dd>{subscription.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">
                  Valor contratado
                </dt>
                <dd>R$ {subscription.priceAtSubscription.toString()} / mês</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">
                  Início do período
                </dt>
                <dd>{formatDate(subscription.currentPeriodStart)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">
                  Fim do período
                </dt>
                <dd>{formatDate(subscription.currentPeriodEnd)}</dd>
              </div>
            </dl>
            <section className="space-y-1 border-t pt-3">
              <h2 className="text-sm font-medium">Instruções de pagamento</h2>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {paymentInstructions ||
                  "A administração da plataforma ainda não configurou as instruções de pagamento."}
              </p>
            </section>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma assinatura vinculada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              A administração da plataforma ainda não vinculou um plano a esta
              barbearia.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
