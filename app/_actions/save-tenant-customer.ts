"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/app/_lib/auth"
import { customerAccountSchema } from "@/app/_lib/customer-account-schema"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit } from "@/app/_lib/rate-limit"
import { resolveTenantBySlug } from "@/app/_lib/tenant/resolve-tenant"

export async function saveTenantCustomer(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/")
  if (session.user.accountType !== "CUSTOMER") redirect("/")

  const parsed = customerAccountSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const slug = formData.get("slug")
    if (typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      redirect(`/${slug}/minha-conta?erro=invalid`)
    }
    redirect("/")
  }

  const { slug, name, phone, email, notes } = parsed.data
  const tenant = await resolveTenantBySlug(slug)
  if (!tenant) redirect("/")

  const limit = await consumeRateLimit(
    "saveTenantCustomer",
    `${tenant.id}:${session.user.id}`,
  )
  if (!limit.allowed) redirect(`/${slug}/minha-conta?erro=rate-limit`)

  await db.customer.upsert({
    where: {
      barbershopId_userId: {
        barbershopId: tenant.id,
        userId: session.user.id,
      },
    },
    update: { name, phone, email: email || null, notes: notes || null },
    create: {
      barbershopId: tenant.id,
      userId: session.user.id,
      name,
      phone,
      email: email || null,
      notes: notes || null,
    },
  })

  revalidatePath(`/${slug}/minha-conta`)
  redirect(`/${slug}/minha-conta?salvo=1`)
}
