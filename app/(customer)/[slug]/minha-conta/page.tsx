import { saveTenantCustomer } from "@/app/_actions/save-tenant-customer"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { getPublicBarbershop } from "@/app/_data/get-public-barbershop"
import { formatBookingDateTime } from "@/app/_lib/booking-date-format"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

type AccountPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ salvo?: string; erro?: string }>
}

export default async function TenantCustomerAccount({
  params,
  searchParams,
}: AccountPageProps) {
  const [{ slug }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  if (!session?.user?.id) redirect("/")

  const barbershop = await getPublicBarbershop(slug)
  if (!barbershop) notFound()

  const customer = await db.customer.findFirst({
    where: { barbershopId: barbershop.id, userId: session.user.id },
    select: { name: true, phone: true, email: true, notes: true, id: true },
  })
  const bookings = customer
    ? await db.booking.findMany({
        where: {
          barbershopId: barbershop.id,
          customerId: customer.id,
          userId: session.user.id,
        },
        orderBy: { date: "desc" },
        select: {
          date: true,
          status: true,
          tenantService: { select: { name: true } },
        },
      })
    : []

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10 lg:px-8">
      <header className="space-y-2">
        <Link className="text-sm underline" href={`/${slug}`}>
          {barbershop.name}
        </Link>
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-muted-foreground">
          Seus dados e agendamentos nesta barbearia.
        </p>
      </header>

      {query.salvo && <p role="status">Dados salvos.</p>}
      {query.erro && (
        <p role="alert">
          {query.erro === "rate-limit"
            ? "Muitas tentativas. Tente novamente em alguns minutos."
            : "Confira os campos e tente novamente."}
        </p>
      )}

      <form action={saveTenantCustomer} className="space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <label className="block space-y-1">
          <span>Nome</span>
          <Input
            name="name"
            required
            maxLength={120}
            defaultValue={customer?.name}
          />
        </label>
        <label className="block space-y-1">
          <span>Telefone</span>
          <Input
            name="phone"
            required
            maxLength={40}
            defaultValue={customer?.phone}
          />
        </label>
        <label className="block space-y-1">
          <span>E-mail (opcional)</span>
          <Input
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
          />
        </label>
        <label className="block space-y-1">
          <span>Observações (opcional)</span>
          <textarea
            className="border-input min-h-24 w-full rounded-md border bg-transparent px-3 py-2"
            name="notes"
            maxLength={1000}
            defaultValue={customer?.notes ?? ""}
          />
        </label>
        <Button type="submit">Salvar dados</Button>
      </form>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-xl font-semibold">Meus agendamentos</h2>
        {bookings.length ? (
          <ul className="space-y-3">
            {bookings.map((booking, index) => (
              <li
                className="rounded-md border p-4"
                key={`${booking.date.toISOString()}-${index}`}
              >
                <p className="font-medium">
                  {booking.tenantService?.name ?? "Serviço indisponível"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {(() => {
                    const { dateLabel, time } = formatBookingDateTime(
                      booking.date,
                      barbershop.timezone,
                    )
                    return `${dateLabel} às ${time}`
                  })()}{" "}
                  · {booking.status}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {customer
              ? "Você ainda não tem agendamentos nesta barbearia."
              : "Salve seus dados para criar sua ficha nesta barbearia. Seu histórico local aparecerá aqui."}
          </p>
        )}
      </section>
    </main>
  )
}
