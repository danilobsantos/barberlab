import { SearchXIcon } from "lucide-react"
import type { Metadata } from "next"
import StatusScreen, { HomeButton } from "./_components/status-screen"

export const metadata: Metadata = {
  title: "Página não encontrada | Barber Lab",
  robots: { index: false, follow: false },
}

const NotFound = () => (
  <StatusScreen
    icon={<SearchXIcon className="h-7 w-7" />}
    eyebrow="Erro 404"
    title="Página não encontrada"
    description="O endereço que você abriu não existe ou saiu do ar. Talvez o link esteja desatualizado."
  >
    <HomeButton />
  </StatusScreen>
)

export default NotFound
