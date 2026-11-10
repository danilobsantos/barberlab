import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { requireAdminContext } from "@/app/_lib/tenant/require-admin-context"
import { redirect } from "next/navigation"
import AdminSidebar from "../../_components/admin-sidebar"
import AdminTabBar from "../../_components/admin-tabbar"
import AdminTopbar from "../../_components/admin-topbar"
import OnboardingTour from "../../_components/onboarding-tour"

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = await requireAdminContext(slug)

  if (!admin) {
    const session = await auth()
    redirect(session?.user ? "/?erro=acesso-negado" : "/")
  }

  const [barbershop, user] = await Promise.all([
    db.barbershop.findUnique({
      where: { id: admin.barbershopId },
      select: { name: true, imageUrl: true, slug: true },
    }),
    db.user.findUnique({
      where: { id: admin.userId },
      select: { onboardingDoneAt: true },
    }),
  ])

  if (!barbershop) redirect("/?erro=barbearia-nao-encontrada")

  const identity = {
    barbershopName: barbershop.name,
    barbershopImageUrl: barbershop.imageUrl,
    userName: admin.name,
    userImage: admin.image,
    slug,
  }

  return (
    <div className="min-h-full">
      <AdminSidebar {...identity} />
      <AdminTopbar {...identity} />
      <main className="pb-24 lg:pb-0 lg:pl-64">{children}</main>
      <AdminTabBar slug={slug} />
      {!user?.onboardingDoneAt && <OnboardingTour />}
    </div>
  )
}
