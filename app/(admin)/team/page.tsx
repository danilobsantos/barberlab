import type { Metadata } from "next"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { redirect } from "next/navigation"
import PageHeader from "../_components/page-header"
import TeamManager from "../_components/team-manager"
import { isInvitationOwner } from "@/app/_lib/membership-invitation"
import { withTenantContext } from "@/app/_lib/database-context"

export const metadata: Metadata = {
  title: "Equipe | Barber Lab",
  description: "Gerencie os profissionais da sua barbearia.",
}

const TeamPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const admin = await requireAdminContext(slug, "manageTeam")
  if (!admin) redirect("/?erro=acesso-negado")

  const [professionals, services] = await Promise.all([
    withTenantContext(
      admin.barbershopId,
      (tx) =>
        tx.professional.findMany({
          where: { barbershopId: admin.barbershopId },
          orderBy: [{ status: "asc" }, { name: "asc" }],
          include: {
            invitation: {
              select: {
                email: true,
                expiresAt: true,
                acceptedAt: true,
                canceledAt: true,
              },
            },
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
            exceptions: {
              where: { barbershopId: admin.barbershopId },
              orderBy: [{ date: "desc" }, { type: "asc" }],
              take: 100,
              select: {
                id: true,
                date: true,
                type: true,
                startsAtLocal: true,
                endsAtLocal: true,
                reason: true,
              },
            },
          },
        }),
      admin.userId,
    ),
    withTenantContext(
      admin.barbershopId,
      (tx) =>
        tx.barbershopService.findMany({
          where: { barbershopId: admin.barbershopId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, isActive: true },
        }),
      admin.userId,
    ),
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
          hasLogin: !!professional.userId,
          invitation: professional.invitation
            ? {
                email: professional.invitation.email,
                expiresAt: professional.invitation.expiresAt.toISOString(),
                accepted: !!professional.invitation.acceptedAt,
                canceled: !!professional.invitation.canceledAt,
              }
            : null,
          services: professional.services.map(({ service }) => service),
          schedules: professional.schedules,
          exceptions: professional.exceptions.map((exception) => ({
            ...exception,
            date: exception.date.toISOString().slice(0, 10),
          })),
        }))}
        services={services}
        canInvite={isInvitationOwner(admin.role)}
      />
    </div>
  )
}

export default TeamPage
