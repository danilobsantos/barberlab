import { PrismaAdapter } from "@auth/prisma-adapter"
import { Role } from "@prisma/client"
import { AuthOptions, getServerSession } from "next-auth"
import { Adapter } from "next-auth/adapters"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import { DEMO_BARBERSHOP_ID, isDemo } from "./deployment"
import { db } from "./prisma"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    ...(process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_ENABLED === "true" &&
    process.env.EMAIL_SERVER &&
    process.env.EMAIL_FROM
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      const legacyUser = user as typeof user & { role?: Role }
      session.user = {
        ...session.user,
        id: user.id,
        isBarbershopAdmin: isDemo || legacyUser.role === Role.BARBER_ADMIN,
      }
      return session
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/",
  },
  debug: false,
}

export const auth = () => getServerSession(authOptions)

export const requireBarbershopAdmin = async () => {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const user = isDemo
    ? { role: Role.BARBER_ADMIN, barbershopId: DEMO_BARBERSHOP_ID }
    : await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, barbershopId: true },
      })

  if (user?.role !== Role.BARBER_ADMIN || !user.barbershopId) {
    return null
  }

  return {
    userId: session.user.id,
    barbershopId: user.barbershopId,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
}
