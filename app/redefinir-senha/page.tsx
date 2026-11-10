import { PasswordResetForm } from "@/app/_components/password-reset-form"
import Link from "next/link"

export const metadata = {
  title: "Redefinir senha | BarberLab",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>
}) {
  const { email = "", token = "" } = await searchParams
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center gap-5 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Criar nova senha</h1>
        <p className="text-muted-foreground text-sm">
          Escolha uma senha com pelo menos 12 caracteres.
        </p>
      </header>
      {email && token ? (
        <PasswordResetForm email={email} token={token} />
      ) : (
        <p className="text-destructive text-sm" role="alert">
          Link inválido. Solicite uma nova recuperação.
        </p>
      )}
      <Link className="text-sm underline" href="/">
        Voltar
      </Link>
    </main>
  )
}
