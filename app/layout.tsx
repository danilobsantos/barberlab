import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "./_components/ui/sonner"
import AuthProvider from "./_providers/auth"
import ProgressProvider from "./_components/progress-bar"
import DemoBanner from "./_components/demo-banner"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://barber-lab.vercel.app/"),
  title: "Barber Lab - Gestão e Agendamento para Barbearias",
  description:
    "Gerencie sua barbearia, equipe, serviços e agendamentos online com o Barber Lab.",
  keywords: [
    "Barber Lab",
    "sistema para barbearia",
    "agendamento barbearia",
    "barbearia online",
    "software barbearia",
    "gestão de barbearia",
    "Barbearia",
    "Cabeleireiro",
    "barber lab",
  ],
  openGraph: {
    title: "Barber Lab - Gestão para Barbearias",
    description:
      "Gerencie equipe, serviços e agendamentos da sua barbearia em uma plataforma.",
    url: "https://barber-lab.vercel.app/",
    siteName: "Barber Lab",
    images: [
      {
        url: "/mobile-banner.png",
        width: 1200,
        height: 630,
        alt: "Barber Lab - Gestão para Barbearias",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#151619",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br" className="dark">
      <body className={inter.className}>
        <DemoBanner />
        <AuthProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </AuthProvider>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  )
}
