import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import RegistrationForm from "./registration-form"
import { redirect } from "next/navigation"

export default async function CadastroPage() {
  const session = await auth()
  if (session?.user?.id) {
    const memberships = await db.membership.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        barbershop: { status: { in: ["ACTIVE", "PENDING_SETUP"] } },
      },
      select: {
        role: true,
        barbershop: { select: { slug: true } },
      },
    })

    if (memberships.length === 1 && memberships[0].role !== "PROFESSIONAL") {
      redirect(`/painel/${memberships[0].barbershop.slug}/dashboard`)
    }
    if (memberships.length > 0) redirect("/minhas-barbearias")
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
      <RegistrationForm authenticated={!!session?.user?.id} />
    </main>
  )
}
