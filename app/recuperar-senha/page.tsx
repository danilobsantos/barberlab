import { PasswordResetRequestForm } from "@/app/_components/password-reset-request-form"
import Link from "next/link"

export const metadata = {
  title: "Recuperar senha | BarberLab",
  robots: { index: false, follow: false },
}

export default function RecoverPasswordPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center gap-5 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <p className="text-muted-foreground text-sm">
          Informe o e-mail da conta. Se ela puder ser recuperada, enviaremos um
          link válido por uma hora.
        </p>
      </header>
      <PasswordResetRequestForm />
      <Link className="text-sm underline" href="/">
        Voltar
      </Link>
    </main>
  )
}
