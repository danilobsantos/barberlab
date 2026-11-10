import "../prisma.config"
import { randomBytes } from "node:crypto"
import { db } from "../app/_lib/prisma"
import { hashPassword } from "../app/_lib/password-crypto"

const database = new URL(process.env.DATABASE_URL ?? "")
if (
  process.env.CREATE_TEST_FIXTURE !== "true" ||
  !["postgres:", "postgresql:"].includes(database.protocol) ||
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  database.port !== "5432" ||
  database.pathname !== "/barberlab"
) {
  throw new Error(
    "Refusing fixture creation outside localhost:5432/barberlab with CREATE_TEST_FIXTURE=true.",
  )
}

const email = "teste@barberlab.invalid"
const slug = "barbearia-teste"
const password = randomBytes(18).toString("base64url")

async function main() {
  const [existingUser, existingShop] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.barbershop.findUnique({ where: { slug }, select: { id: true } }),
  ])
  if (existingUser || existingShop) {
    throw new Error(
      "Test account or barbershop already exists; refusing to overwrite.",
    )
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 30)

  const fixture = await db.$transaction(async (tx) => {
    const shop = await tx.barbershop.create({
      data: {
        name: "Barbearia Teste BarberLab",
        slug,
        timezone: "America/Sao_Paulo",
        status: "ACTIVE",
        address: "Rua de Testes, 100 — São Paulo, SP",
        phones: ["(11) 99999-0000"],
        description: "Barbearia fictícia para testes locais do BarberLab.",
        imageUrl: "/logo.png",
      },
    })
    const owner = await tx.user.create({
      data: {
        name: "Proprietário de Teste",
        email,
        emailVerified: now,
        accountType: "BARBERSHOP",
        passwordHash: await hashPassword(password),
        role: "BARBER_ADMIN",
        barbershopId: shop.id,
      },
    })
    const plan = await tx.plan.create({
      data: {
        name: "Plano de Teste",
        slug: "plano-teste-barberlab",
        description: "Plano fictício para testes locais.",
        priceMonthly: 0,
        maxProfessionals: 3,
        features: { professional_schedule: true },
      },
    })
    await tx.membership.create({
      data: {
        userId: owner.id,
        barbershopId: shop.id,
        role: "OWNER",
        status: "ACTIVE",
        acceptedAt: now,
      },
    })
    await tx.subscription.create({
      data: {
        barbershopId: shop.id,
        planId: plan.id,
        status: "TRIALING",
        priceAtSubscription: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    })

    const services = await Promise.all([
      tx.barbershopService.create({
        data: {
          barbershopId: shop.id,
          name: "Corte masculino",
          description: "Corte com máquina ou tesoura.",
          imageUrl: "/cabelo.svg",
          price: 60,
          durationMinutes: 45,
        },
      }),
      tx.barbershopService.create({
        data: {
          barbershopId: shop.id,
          name: "Barba",
          description: "Modelagem e acabamento de barba.",
          imageUrl: "/barba.svg",
          price: 40,
          durationMinutes: 30,
        },
      }),
      tx.barbershopService.create({
        data: {
          barbershopId: shop.id,
          name: "Corte + barba",
          description: "Corte masculino com modelagem de barba.",
          imageUrl: "/acabamento.svg",
          price: 90,
          durationMinutes: 60,
        },
      }),
    ])
    const professional = await tx.professional.create({
      data: {
        barbershopId: shop.id,
        name: "Profissional de Teste",
        status: "ACTIVE",
      },
    })
    await tx.professionalService.createMany({
      data: services.map((service) => ({
        barbershopId: shop.id,
        professionalId: professional.id,
        serviceId: service.id,
      })),
    })
    await tx.openingHour.createMany({
      data: Array.from({ length: 7 }, (_, weekday) => ({
        barbershopId: shop.id,
        weekday,
        opensAt: "09:00",
        closesAt: "18:00",
        isClosed: weekday === 0,
      })),
    })
    await tx.professionalSchedule.createMany({
      data: Array.from({ length: 6 }, (_, index) => ({
        barbershopId: shop.id,
        professionalId: professional.id,
        weekday: index + 1,
        startsAtLocal: "09:00",
        endsAtLocal: "18:00",
      })),
    })

    return { shop, owner, services }
  })

  console.log(
    JSON.stringify(
      {
        barbershop: { name: fixture.shop.name, slug: fixture.shop.slug },
        services: fixture.services.map(({ name, price, durationMinutes }) => ({
          name,
          price: Number(price),
          durationMinutes,
        })),
        owner: { email: fixture.owner.email, password },
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
