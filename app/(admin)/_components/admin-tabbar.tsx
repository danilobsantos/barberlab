"use client"

import { cn } from "@/app/_lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getAdminNavItems } from "./admin-nav"

const AdminTabBar = ({ slug }: { slug: string }) => {
  const pathname = usePathname()
  const navItems = getAdminNavItems(slug)

  return (
    <nav className="bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.shortLabel}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default AdminTabBar
