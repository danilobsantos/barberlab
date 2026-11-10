import BarbershopDetail from "../_components/barbershop-detail"
import { getPublicBarbershop } from "@/app/_data/get-public-barbershop"
import { getBarbershopOpeningHours } from "@/app/_data/get-opening-hours"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type BarbershopPageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: BarbershopPageProps): Promise<Metadata> {
  const { slug } = await params
  const barbershop = await getPublicBarbershop(slug)
  if (!barbershop) notFound()

  const description = `Agende online na ${barbershop.name}, em ${barbershop.address}. Veja os serviços, preços e horários disponíveis.`

  return {
    title: `${barbershop.name} | Barber Lab`,
    description,
    alternates: { canonical: `/${barbershop.slug}` },
    openGraph: {
      title: `${barbershop.name} | Barber Lab`,
      description,
      url: `/${barbershop.slug}`,
      images: barbershop.imageUrl ? [barbershop.imageUrl] : undefined,
    },
  }
}

export default async function BarbershopPage({ params }: BarbershopPageProps) {
  const { slug } = await params
  const barbershop = await getPublicBarbershop(slug)
  if (!barbershop) notFound()

  const openingHours = await getBarbershopOpeningHours(barbershop.id)

  return (
    <BarbershopDetail
      barbershop={barbershop}
      openingHours={openingHours}
      publicProfile
      bookingSlug={barbershop.slug}
      showHeroNav={false}
    />
  )
}
