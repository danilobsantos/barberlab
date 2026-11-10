import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { requireBarbershopAdmin } from "@/app/_lib/auth"
import { withDefaults } from "@/app/_lib/opening-hours"
import { db } from "@/app/_lib/prisma"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/app/_components/ui/button"
import BarbershopProfileForm from "../_components/barbershop-profile-form"
import OpeningHoursForm from "../_components/opening-hours-form"
import PageHeader from "../_components/page-header"

export const metadata: Metadata = {
  title: "Configurações | Barber Lab",
  description: "Dados da barbearia e horário de funcionamento.",
}

const Settings = async ({ params }: { params: Promise<{ slug?: string }> }) => {
  const { slug } = await params
  const tenantAdmin = slug ? await requireAdminContext(slug) : null
  const admin = slug ? tenantAdmin : await requireBarbershopAdmin()
  if (!admin) redirect("/")

  if (!slug) {
    const shop = await db.barbershop.findUnique({
      where: { id: admin.barbershopId },
      select: { slug: true },
    })
    if (shop) redirect(`/painel/${shop.slug}/settings`)
    redirect("/")
  }

  const [barbershop, salvos] = await Promise.all([
    db.barbershop.findUnique({
      where: { id: admin.barbershopId },
      select: {
        name: true,
        address: true,
        description: true,
        imageUrl: true,
        phones: true,
      },
    }),
    db.openingHour.findMany({
      where: { barbershopId: admin.barbershopId },
      orderBy: { weekday: "asc" },
      select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
    }),
  ])

  if (!barbershop) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-5 lg:px-8 lg:py-10">
      <section className="space-y-6">
        <PageHeader
          eyebrow="Configurações"
          title="Dados da barbearia"
          description="Nome, endereço, foto e telefones que o cliente vê antes de agendar."
        />

        <BarbershopProfileForm
          profile={{
            ...barbershop,
            phones: barbershop.phones.length > 0 ? barbershop.phones : [""],
          }}
        />
      </section>

      <section className="space-y-6">
        <PageHeader
          eyebrow="Configurações"
          title="Horário de funcionamento"
          description="Define os horários que aparecem para o cliente na hora de agendar."
        />

        <OpeningHoursForm hours={withDefaults(salvos)} />
      </section>

      {tenantAdmin?.role === "OWNER" && (
        <section className="space-y-4 border-t pt-6">
          <PageHeader
            eyebrow="Conta"
            title="Plano e assinatura"
            description="Consulte o plano, o status e o período contratado."
          />
          <Button asChild variant="outline">
            <Link href={`/painel/${slug}/assinatura`}>Ver assinatura</Link>
          </Button>
        </section>
      )}
    </div>
  )
}

export default Settings
