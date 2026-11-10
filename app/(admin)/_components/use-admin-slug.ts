"use client"

import { usePathname } from "next/navigation"

export function useAdminSlug() {
  const match = usePathname().match(/^\/painel\/([^/]+)/)
  return match?.[1] ?? ""
}
