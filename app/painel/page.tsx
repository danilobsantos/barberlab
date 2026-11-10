import { Button } from "@/app/_components/ui/button"
import { requirePlatformAdmin } from "@/app/_lib/platform/require-platform-admin"
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Plataforma | Barber Lab",
  robots: { index: false, follow: false },
}

export default async function PlatformPanelPage() {
  const admin = await requirePlatformAdmin()
  if (!admin) notFound()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-5 py-12">
      <ShieldCheckIcon className="text-primary h-8 w-8" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-primary text-sm font-semibold">
          BARBER LAB · PLATAFORMA
        </p>
        <h1 className="text-3xl font-semibold">Administração da plataforma</h1>
        <p className="text-muted-foreground">
          Acesso global autorizado para {admin.name ?? "Superadministrador"}.
        </p>
      </div>
      <Button asChild className="w-fit">
        <Link href="/painel/planos">Gerenciar planos</Link>
      </Button>
      <Button asChild variant="outline" className="w-fit">
        <Link href="/painel/assinaturas">Gerenciar assinaturas</Link>
      </Button>
      <Button asChild variant="outline" className="w-fit">
        <Link href="/minhas-barbearias">
          <ArrowLeftIcon />
          Minhas barbearias
        </Link>
      </Button>
    </main>
  )
}
