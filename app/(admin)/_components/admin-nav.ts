import {
  CalendarRangeIcon,
  LayoutDashboardIcon,
  ScissorsIcon,
  SettingsIcon,
} from "lucide-react"

const NAV_ITEMS = [
  {
    href: "/dashboard",
    tour: "tour-dashboard",
    label: "Dashboard",
    shortLabel: "Hoje",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/schedule",
    tour: "tour-schedule",
    label: "Agenda",
    shortLabel: "Agenda",
    icon: CalendarRangeIcon,
  },
  {
    href: "/services",
    tour: "tour-services",
    label: "Serviços",
    shortLabel: "Serviços",
    icon: ScissorsIcon,
  },
  {
    href: "/settings",
    tour: "tour-settings",
    label: "Configurações",
    shortLabel: "Ajustes",
    icon: SettingsIcon,
  },
] as const

export const getAdminNavItems = (slug: string) =>
  NAV_ITEMS.map((item) => ({ ...item, href: `/painel/${slug}${item.href}` }))
