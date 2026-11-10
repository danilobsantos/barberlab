import type { Metadata } from "next"
import { db } from "@/app/_lib/prisma"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { redirect } from "next/navigation"
import PageHeader from "../_components/page-header"
import TeamManager from "../_components/team-manager"

export const metadata: Metadata = {
  title: "Equipe | Barber Lab",
  description: "Gerencie os profissionais da sua barbearia.",
}

const TeamPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) redirect("/?erro=acesso-negado")

  const [professionals, services] = await Promise.all([
    db.professional.findMany({
      where: { barbershopId: admin.barbershopId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: {
        services: {
          where: { barbershopId: admin.barbershopId },
          select: { service: { select: { id: true, name: true } } },
        },
        schedules: {
          where: { barbershopId: admin.barbershopId },
          orderBy: [{ weekday: "asc" }, { startsAtLocal: "asc" }],
          select: {
            weekday: true,
            startsAtLocal: true,
            endsAtLocal: true,
          },
        },
      },
    }),
    db.barbershopService.findMany({
      where: { barbershopId: admin.barbershopId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-5 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Gestão"
        title="Equipe"
        description="Cadastre profissionais, gerencie o status e associe serviços."
      />
      <TeamManager
        professionals={professionals.map((professional) => ({
          id: professional.id,
          name: professional.name,
          displayName: professional.displayName,
          email: professional.email,
          phone: professional.phone,
          bio: professional.bio,
          isActive: professional.status === "ACTIVE",
          services: professional.services.map(({ service }) => service),
          schedules: professional.schedules,
        }))}
        services={services}
      />
    </div>
  )
}

export default TeamPage
