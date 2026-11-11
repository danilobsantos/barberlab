import { withDefaults } from "@/app/_lib/opening-hours"
import { withTenantContext } from "@/app/_lib/database-context"

export const getBarbershopOpeningHours = async (barbershopId: string) =>
  withDefaults(
    await withTenantContext(barbershopId, (tx) =>
      tx.openingHour.findMany({
        where: { barbershopId },
        orderBy: { weekday: "asc" },
        select: {
          weekday: true,
          opensAt: true,
          closesAt: true,
          isClosed: true,
        },
      }),
    ),
  )
