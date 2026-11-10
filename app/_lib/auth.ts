import { PrismaAdapter } from "@auth/prisma-adapter"
import { Role } from "@prisma/client"
import { AuthOptions, getServerSession } from "next-auth"
import { Adapter } from "next-auth/adapters"
import CredentialsProvider from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import { DEMO_BARBERSHOP_ID, isDemo } from "./deployment"
import { db } from "./prisma"
import { passwordCredentialsSchema } from "./password-auth-schema"
import { verifyPassword } from "./password-crypto"
import { consumeRateLimit } from "./rate-limit"

const emailAuthEnabled =
  process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_ENABLED === "true"
const emailLinkEnabled =
  emailAuthEnabled && !!process.env.EMAIL_SERVER && !!process.env.EMAIL_FROM

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Google supplies verified email addresses; allow that identity to link to email auth.
      allowDangerousEmailAccountLinking: true,
    }),
    ...(emailLinkEnabled
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
    ...(emailAuthEnabled
      ? [
          CredentialsProvider({
            credentials: {
              email: { label: "E-mail", type: "email" },
              password: { label: "Senha", type: "password" },
              accountType: { label: "Tipo de conta", type: "text" },
            },
            async authorize(credentials) {
              const parsed = passwordCredentialsSchema.safeParse(credentials)
              if (!parsed.success) return null

              const limit = await consumeRateLimit(
                "passwordLogin",
                parsed.data.email,
              )
              if (!limit.allowed) return null

              const user = await db.user.findUnique({
                where: { email: parsed.data.email },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  emailVerified: true,
                  passwordHash: true,
                  accountType: true,
                },
              })
              if (
                !user?.emailVerified ||
                !user.passwordHash ||
                user.accountType !== parsed.data.accountType ||
                !(await verifyPassword(parsed.data.password, user.passwordHash))
              ) {
                return null
              }

              return { id: user.id, name: user.name, email: user.email }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user: signedInUser }) {
      if (signedInUser?.id) {
        const user = await db.user.findUnique({
          where: { id: signedInUser.id },
          select: { authVersion: true },
        })
        token.authVersion = user?.authVersion
      }
      return token
    },
    async session({ session, token }) {
      if (!token.sub) return session
      const user = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true, accountType: true, authVersion: true },
      })
      if (!user || token.authVersion !== user.authVersion) {
        session.user = {
          id: "",
          isBarbershopAdmin: false,
          accountType: "CUSTOMER",
          name: null,
          email: null,
          image: null,
        }
        return session
      }
      session.user = {
        ...session.user,
        id: token.sub,
        isBarbershopAdmin: isDemo || user.role === Role.BARBER_ADMIN,
        accountType: user.accountType,
      }
      return session
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  debug: false,
}

export const auth = () => getServerSession(authOptions)

export const requireBarbershopAdmin = async () => {
  const session = await auth()

  if (!session?.user?.id) {
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
