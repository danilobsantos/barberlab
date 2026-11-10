import BarbershopDetail from "../../_components/barbershop-detail"
import { getPublicBarbershop } from "@/app/_data/get-public-barbershop"
import { getBarbershopOpeningHours } from "@/app/_data/get-opening-hours"
import { notFound } from "next/navigation"

type BookingPageProps = { params: Promise<{ slug: string }> }

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params
  const barbershop = await getPublicBarbershop(slug)
  if (!barbershop) notFound()

  const openingHours = await getBarbershopOpeningHours(barbershop.id)

  return (
    <BarbershopDetail
      barbershop={barbershop}
      openingHours={openingHours}
      publicProfile
      bookingEnabled
      bookingSlug={barbershop.slug}
      showHeroNav={false}
    />
  )
}
