import BarbershopDetail from "../../_components/barbershop-detail"
import { getPublicBarbershop } from "@/app/_data/get-public-barbershop"
import { getBarbershopOpeningHours } from "@/app/_data/get-opening-hours"
import { notFound } from "next/navigation"
import Link from "next/link"

type BookingPageProps = { params: Promise<{ slug: string }> }

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params
  const barbershop = await getPublicBarbershop(slug)
  if (!barbershop) notFound()

  const openingHours = await getBarbershopOpeningHours(barbershop.id)

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-4 text-right">
        <Link
          className="text-sm underline"
          href={`/${barbershop.slug}/minha-conta`}
        >
          Minha conta
        </Link>
      </div>
      <BarbershopDetail
        barbershop={barbershop}
        openingHours={openingHours}
        publicProfile
        bookingEnabled
        bookingSlug={barbershop.slug}
        showHeroNav={false}
      />
    </>
  )
}
