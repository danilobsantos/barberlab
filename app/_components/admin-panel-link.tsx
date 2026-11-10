"use client"

import { LayoutDashboardIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"

const AdminPanelLink = ({ className }: { className?: string }) => {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !session?.user?.id) return null

  return (
    <Button variant="secondary" className={className} asChild>
      <Link href="/minhas-barbearias">
        <LayoutDashboardIcon size={18} />
        Minhas barbearias
      </Link>
    </Button>
  )
}

export default AdminPanelLink
