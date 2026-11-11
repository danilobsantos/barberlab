"use server"

import { auth } from "@/app/_lib/auth"
import { barbershopRegistrationSchema } from "@/app/_lib/barbershop-registration-schema"
import { DEFAULT_OPENING_HOURS } from "@/app/_lib/opening-hours"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { db } from "@/app/_lib/prisma"
import { Prisma, Role } from "@prisma/client"
import { redirect } from "next/navigation"
import { randomUUID } from "node:crypto"
import { withTenantContext } from "@/app/_lib/database-context"

export interface RegistrationState {
  error?: string
  fieldErrors?: Partial<Record<"name" | "slug" | "address" | "phone", string>>
}

class ExistingCustomerAccountError extends Error {}

export const registerBarbershop = async (
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> => {
  const session = await auth()
  if (!session?.user?.id) return { error: "Entre na sua conta para continuar." }

  const limit = await consumeRateLimit("registerBarbershop", session.user.id)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsed = barbershopRegistrationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    address: formData.get("address"),
    phone: formData.get("phone"),
  })
  if (!parsed.success) {
    const fieldErrors: RegistrationState["fieldErrors"] = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<
        RegistrationState["fieldErrors"]
      >
      fieldErrors[field] ??= issue.message
    }
    return { fieldErrors }
  }

  try {
    const barbershopId = randomUUID()
    await withTenantContext(
      barbershopId,
      () =>
        db.$transaction(async (tx) => {
          const account = await tx.user.findUnique({
            where: { id: session.user.id },
            select: { accountType: true },
          })
          if (!account) throw new Error("Registration account not found")
          if (account.accountType === "CUSTOMER") {
            const [customerProfile, booking] = await Promise.all([
              tx.customer.findFirst({
                where: { userId: session.user.id },
                select: { id: true },
              }),
              tx.booking.findFirst({
                where: { userId: session.user.id },
                select: { id: true },
              }),
            ])
            if (customerProfile || booking)
              throw new ExistingCustomerAccountError()
          }

          const shop = await tx.barbershop.create({
            data: {
              id: barbershopId,
              name: parsed.data.name,
              slug: parsed.data.slug,
              address: parsed.data.address,
              phones: [parsed.data.phone],
              description: "",
              imageUrl: "",
              status: "PENDING_SETUP",
            },
          })
          await tx.membership.create({
            data: {
              userId: session.user.id,
              barbershopId: shop.id,
              role: "OWNER",
              status: "ACTIVE",
              acceptedAt: new Date(),
            },
          })
          await tx.openingHour.createMany({
            data: DEFAULT_OPENING_HOURS.map((hour) => ({
              ...hour,
              barbershopId: shop.id,
            })),
          })
          await tx.user.update({
            where: { id: session.user.id },
            data: {
              accountType: "BARBERSHOP",
              role: Role.BARBER_ADMIN,
              barbershopId: shop.id,
            },
          })
        }),
      session.user.id,
    )
  } catch (error) {
    if (error instanceof ExistingCustomerAccountError) {
      return {
        error:
          "Esta conta já é usada como cliente. Entre com outro e-mail para criar uma conta de barbearia.",
      }
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target
      if (Array.isArray(target) && target.includes("slug")) {
        return { fieldErrors: { slug: "Este endereço já está em uso." } }
      }
      if (typeof target === "string" && target.includes("slug")) {
        return { fieldErrors: { slug: "Este endereço já está em uso." } }
      }
    }
    console.error("[register-barbershop] falha ao criar barbearia", error)
    return { error: "Não foi possível criar sua barbearia. Tente novamente." }
  }

  redirect(`/painel/${parsed.data.slug}/dashboard`)
}
