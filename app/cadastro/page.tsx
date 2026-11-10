import { auth } from "@/app/_lib/auth"
import RegistrationForm from "./registration-form"

export default async function CadastroPage() {
  const session = await auth()
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
      <RegistrationForm authenticated={!!session?.user?.id} />
    </main>
  )
}
