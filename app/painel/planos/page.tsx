import { Button } from "@/app/_components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import { db } from "@/app/_lib/prisma"
import { PencilIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  savePlatformPlan,
  setPlatformPlanActive,
} from "@/app/_actions/platform-plans"

export const metadata = {
  title: "Planos | Barber Lab",
  robots: { index: false, follow: false },
}

export default async function PlatformPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; edit?: string }>
}) {
  const admin = await requirePlatformAdmin()
  if (!admin) notFound()
  const params = await searchParams
  const [plans, editing] = await Promise.all([
    db.plan.findMany({ orderBy: { createdAt: "asc" } }),
    params.edit ? db.plan.findUnique({ where: { id: params.edit } }) : null,
  ])

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-5 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <ShieldCheckIcon
            className="text-primary h-7 w-7"
            aria-hidden="true"
          />
          <p className="text-primary text-sm font-semibold">
            BARBER LAB · PLATAFORMA
          </p>
          <h1 className="text-3xl font-semibold">Planos</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/painel">Painel</Link>
        </Button>
      </header>

      {params.error === "slug" && <p role="alert">Esse slug já está em uso.</p>}
      {params.error === "invalid" && (
        <p role="alert">Confira os dados informados.</p>
      )}
      {params.saved && <p role="status">Plano salvo.</p>}

      <Card>
        <CardHeader>
          <CardTitle>
            {editing ? `Editar ${editing.name}` : "Novo plano"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={savePlatformPlan} className="grid gap-4 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <label className="grid gap-1 text-sm">
              Nome
              <Input
                name="name"
                required
                maxLength={80}
                defaultValue={editing?.name}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Slug
              <Input
                name="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                defaultValue={editing?.slug}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Descrição
              <Input
                name="description"
                required
                maxLength={500}
                defaultValue={editing?.description}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Preço mensal (R$)
              <Input
                name="priceMonthly"
                inputMode="decimal"
                required
                defaultValue={editing?.priceMonthly.toString()}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Limite de profissionais (vazio = ilimitado)
              <Input
                name="maxProfessionals"
                type="number"
                min="1"
                step="1"
                defaultValue={editing?.maxProfessionals ?? ""}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Funcionalidades (chaves separadas por vírgula)
              <Input
                name="features"
                placeholder="reports_basic, professional_schedule"
                defaultValue={
                  editing
                    ? Object.keys(editing.features as Record<string, boolean>)
                        .filter(
                          (key) =>
                            (editing.features as Record<string, boolean>)[key],
                        )
                        .join(", ")
                    : ""
                }
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Salvar plano</Button>
              {editing && (
                <Button asChild variant="outline">
                  <Link href="/painel/planos">Cancelar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={!plan.isActive ? "opacity-60" : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  /{plan.slug} · R$ {plan.priceMonthly.toString()}/mês
                </p>
              </div>
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label={`Editar ${plan.name}`}
              >
                <Link href={`/painel/planos?edit=${plan.id}`}>
                  <PencilIcon />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>{plan.description}</p>
              <p className="text-muted-foreground text-sm">
                {plan.maxProfessionals ?? "Ilimitados"} profissionais ·{" "}
                {Object.keys(plan.features as object).length} funcionalidades ·{" "}
                {plan.isActive ? "Ativo" : "Inativo"}
              </p>
              <form action={setPlatformPlanActive}>
                <input type="hidden" name="id" value={plan.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!plan.isActive)}
                />
                <Button type="submit" size="sm" variant="outline">
                  {plan.isActive ? "Desativar" : "Ativar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
