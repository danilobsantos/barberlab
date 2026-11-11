import { setPlatformBarbershopStatus } from "@/app/_actions/platform-barbershops"
import { Button } from "@/app/_components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import Link from "next/link"
import { notFound } from "next/navigation"
import { withPlatformContext } from "@/app/_lib/database-context"

export const metadata = {
  title: "Barbearias | Barber Lab",
  robots: { index: false, follow: false },
}

export default async function PlatformBarbershopsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const admin = await requirePlatformAdmin()
  if (!admin) notFound()
  const params = await searchParams
  const barbershops = await withPlatformContext(admin.userId, (tx) =>
    tx.barbershop.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: true, professionals: true } },
      },
    }),
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-5 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-primary text-sm font-semibold">
            BARBER LAB · PLATAFORMA
          </p>
          <h1 className="text-3xl font-semibold">Barbearias</h1>
          <p className="text-muted-foreground">
            {barbershops.length} tenants cadastrados
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/painel">Painel</Link>
        </Button>
      </header>

      {params.error && (
        <p role="alert">Não foi possível atualizar essa barbearia.</p>
      )}
      {params.saved && <p role="status">Status atualizado.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {barbershops.map((shop) => (
          <Card key={shop.id}>
            <CardHeader>
              <CardTitle>{shop.name}</CardTitle>
              <p className="text-muted-foreground text-sm">/{shop.slug}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                {shop.status} · {shop._count.memberships} vínculos ·{" "}
                {shop._count.professionals} profissionais
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/painel/assinaturas">Assinatura</Link>
                </Button>
                {shop.status === "ACTIVE" && (
                  <form action={setPlatformBarbershopStatus}>
                    <input type="hidden" name="barbershopId" value={shop.id} />
                    <input type="hidden" name="status" value="SUSPENDED" />
                    <Button size="sm" variant="destructive" type="submit">
                      Suspender
                    </Button>
                  </form>
                )}
                {shop.status === "SUSPENDED" && (
                  <form action={setPlatformBarbershopStatus}>
                    <input type="hidden" name="barbershopId" value={shop.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <Button size="sm" type="submit">
                      Reativar
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
