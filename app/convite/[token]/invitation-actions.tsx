"use client"

import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { acceptMembershipInvitation } from "@/app/_actions/accept-membership-invitation"
import { EmailSignIn } from "@/app/_components/email-sign-in"
import { PasswordAuthForm } from "@/app/_components/password-auth-form"
import { Button } from "@/app/_components/ui/button"

export function InvitationSignIn({
  callbackUrl,
  signedIn,
}: {
  callbackUrl: string
  signedIn: boolean
}) {
  if (signedIn) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => signOut({ callbackUrl })}
      >
        Sair e entrar com outra conta
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      {process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_ENABLED === "true" && (
        <PasswordAuthForm accountType="INVITATION" callbackUrl={callbackUrl} />
      )}
      <p className="text-muted-foreground text-center text-sm">ou</p>
      <Button
        className="w-full"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continuar com Google
      </Button>
      {process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_ENABLED === "true" && (
        <EmailSignIn callbackUrl={callbackUrl} />
      )}
    </div>
  )
}

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const accept = () =>
    startTransition(async () => {
      const result = await acceptMembershipInvitation(token)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      router.replace(result.redirectTo)
      router.refresh()
    })

  return (
    <Button className="w-full" onClick={accept} disabled={pending}>
      {pending ? "Aceitando convite…" : "Aceitar convite"}
    </Button>
  )
}
