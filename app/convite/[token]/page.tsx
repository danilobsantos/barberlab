import { notFound } from "next/navigation"
import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import {
  hashInvitationToken,
  invitationTokenSchema,
  isInvitationAcceptable,
  normalizeInvitationEmail,
} from "@/app/_lib/membership-invitation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { AcceptInvitationButton, InvitationSignIn } from "./invitation-actions"

export const metadata = {
  title: "Convite para a equipe | BarberLab",
  referrer: "no-referrer" as const,
}

export default async function MembershipInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!invitationTokenSchema.safeParse(token).success) notFound()

  const invitation = await db.professionalInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      email: true,
      expiresAt: true,
      acceptedAt: true,
      canceledAt: true,
      professional: {
        select: {
          name: true,
          email: true,
          status: true,
          barbershop: { select: { name: true, status: true } },
        },
      },
    },
  })
  if (!invitation) notFound()

  const session = await auth()
  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, emailVerified: true },
      })
    : null
  const emailMatches =
    !!user?.email &&
    normalizeInvitationEmail(user.email) ===
      normalizeInvitationEmail(invitation.email)
  const tokenIsUsable =
    isInvitationAcceptable(invitation, invitation.email) &&
    invitation.professional.status === "ACTIVE" &&
    invitation.professional.barbershop.status !== "SUSPENDED" &&
    invitation.professional.barbershop.status !== "ARCHIVED" &&
    normalizeInvitationEmail(invitation.professional.email ?? "") ===
      normalizeInvitationEmail(invitation.email)
  const inviteUrl = `/convite/${token}`

  let message: string | null = null
  if (invitation.acceptedAt) message = "Este convite já foi aceito."
  else if (invitation.canceledAt) message = "Este convite foi cancelado."
  else if (invitation.expiresAt <= new Date())
    message =
      "Este convite expirou. Peça ao dono da barbearia para enviar outro."
  else if (!tokenIsUsable)
    message =
      "Este convite não está mais válido. Peça ao dono da barbearia para reenviá-lo."

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-5">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Convite para a equipe</CardTitle>
          <p className="text-muted-foreground text-sm">
            {invitation.professional.name} foi convidado(a) para a equipe de{" "}
            {invitation.professional.barbershop.name}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Convite enviado para <strong>{invitation.email}</strong>. O link é
            válido por 7 dias e pode ser usado uma única vez.
          </p>
          {message ? (
            <p className="text-muted-foreground text-sm" role="status">
              {message}
            </p>
          ) : !session?.user?.id ? (
            <InvitationSignIn callbackUrl={inviteUrl} signedIn={false} />
          ) : !emailMatches ? (
            <div className="space-y-3">
              <p className="text-destructive text-sm" role="alert">
                Entre com a conta de e-mail convidada para continuar.
              </p>
              <InvitationSignIn callbackUrl={inviteUrl} signedIn />
            </div>
          ) : !user?.emailVerified ? (
            <p className="text-destructive text-sm" role="alert">
              Confirme seu e-mail antes de aceitar este convite.
            </p>
          ) : (
            <AcceptInvitationButton token={token} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
