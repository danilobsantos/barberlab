import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { ArrowRightIcon, StoreIcon } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"

const MEMBERSHIP_ROLE_LABEL = {
  OWNER: "Proprietário",
  MANAGER: "Gerente",
  PROFESSIONAL: "Profissional",
} as const

export default async function MyBarbershopsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const memberships = await db.membership.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      barbershop: { status: { in: ["ACTIVE", "PENDING_SETUP"] } },
    },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      barbershop: { select: { name: true, slug: true, address: true } },
    },
  })

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-8 px-5 py-12">
      <header className="space-y-2">
        <p className="text-primary text-sm font-semibold">BARBER LAB</p>
        <h1 className="text-3xl font-semibold">Minhas barbearias</h1>
        <p className="text-muted-foreground">
          Escolha qual espaço de trabalho deseja abrir.
        </p>
      </header>

      {memberships.length ? (
        <ul className="space-y-3">
          {memberships.map(({ role, barbershop }) => (
            <li key={barbershop.slug}>
              <Card>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <StoreIcon
                      className="text-primary h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {barbershop.name}
                      </h2>
                      <p className="text-muted-foreground truncate text-sm">
                        {barbershop.address} · {MEMBERSHIP_ROLE_LABEL[role]}
                      </p>
                    </div>
                  </div>
                  {role === "PROFESSIONAL" ? (
                    <span className="text-muted-foreground text-right text-xs">
                      Painel profissional em breve
                    </span>
                  ) : (
                    <Button asChild>
                      <Link href={`/painel/${barbershop.slug}/dashboard`}>
                        Abrir <ArrowRightIcon />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">Você ainda não tem uma barbearia</h2>
            <p className="text-muted-foreground text-sm">
              Crie uma barbearia para começar a configurar seu espaço.
            </p>
            <Button asChild>
              <Link href="/cadastro">Criar barbearia</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
