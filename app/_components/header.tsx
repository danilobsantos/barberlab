"use client"

import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Link from "next/link"
import UserMenu from "./user-menu"
import AdminPanelLink from "./admin-panel-link"

interface HeaderProps {
  singleTenant?: boolean
}

const Header = ({ singleTenant = false }: HeaderProps) => {
  return (
    <Card className="bg-card/95 sticky top-0 z-50 border-b backdrop-blur-sm">
      <CardContent className="flex flex-row items-center justify-between p-5 lg:px-8 lg:py-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            alt="Barber Lab"
            src="/logo.png"
            priority
            height={18}
            width={120}
            className="h-auto w-auto lg:h-8"
          />
        </Link>

        {/* Navegação Desktop */}
        <nav className="hidden lg:flex lg:items-center lg:gap-8">
          <Link
            href="/"
            className="text-foreground hover:text-primary group relative text-sm font-medium transition-colors"
          >
            Início
            <span className="bg-primary absolute -bottom-1 left-0 h-0.5 w-0 transition-all group-hover:w-full"></span>
          </Link>
          <Link
            href="/bookings"
            className="text-foreground hover:text-primary group relative text-sm font-medium transition-colors"
          >
            Agendamentos
            <span className="bg-primary absolute -bottom-1 left-0 h-0.5 w-0 transition-all group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Ações Desktop */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <AdminPanelLink />

          <Link
            href="/cadastro"
            className="text-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            Criar barbearia
          </Link>

          <UserMenu />

          {singleTenant && (
            <Button className="bg-primary hover:bg-primary/50" asChild>
              <Link href="/#servicos">Agendar</Link>
            </Button>
          )}
        </div>

        {/* Botão do menu mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="lg:hidden">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </CardContent>
    </Card>
  )
}

export default Header
