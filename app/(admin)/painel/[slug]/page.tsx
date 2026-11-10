import { redirect } from "next/navigation"

export default async function TenantPanelPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/painel/${slug}/dashboard`)
}
