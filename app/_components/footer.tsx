import { CardContent } from "./ui/card"
import { MapPinIcon, MessageCircleIcon, MailIcon } from "lucide-react"
import Link from "next/link"
import { isSingleTenant } from "@/app/_lib/deployment"

const Footer = () => {
  return (
    <footer className="bg-card/30 border-t backdrop-blur-sm">
      <CardContent className="px-5 py-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Mobile layout */}
          <div className="lg:hidden">
            <p className="text-center text-sm text-gray-400">
              © {new Date().getFullYear()} Copyright{" "}
              <span className="font-bold">Barber Lab</span>
            </p>

            <p>
              {" "}
              Desenvolvido por{" "}
              <span className="font-bold">DevStudio - Inovação Digital</span>
            </p>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:block">
            <div className="mb-8 grid grid-cols-4 gap-8">
              {/* Brand column */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Barber Lab</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A melhor plataforma para agendar seu horário com os melhores
                  barbeiros da cidade.
                </p>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPinIcon className="h-4 w-4" />
                  <span>São Paulo, SP</span>
                </div>
              </div>

              {/* Services column */}
              <div className="space-y-4">
                <h4 className="font-semibold">Serviços</h4>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>
                    <Link
                      href={
                        isSingleTenant
                          ? "/#servicos"
                          : "/barbershops?service=Cabelo"
                      }
                      className="hover:text-primary transition-colors"
                    >
                      Corte de Cabelo
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        isSingleTenant
                          ? "/#servicos"
                          : "/barbershops?service=Barba"
                      }
                      className="hover:text-primary transition-colors"
                    >
                      Barba
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        isSingleTenant
                          ? "/#servicos"
                          : "/barbershops?service=Acabamento"
                      }
                      className="hover:text-primary transition-colors"
                    >
                      Acabamento
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        isSingleTenant
                          ? "/#servicos"
                          : "/barbershops?service=Massagem"
                      }
                      className="hover:text-primary transition-colors"
                    >
                      Massagem
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company column */}
              <div className="space-y-4">
                <h4 className="font-semibold">Empresa</h4>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>
                    <Link
                      href="/sobre"
                      className="hover:text-primary transition-colors"
                    >
                      Sobre nós
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/carreiras"
                      className="hover:text-primary transition-colors"
                    >
                      Carreiras
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/parceiros"
                      className="hover:text-primary transition-colors"
                    >
                      Parceiros
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contato"
                      className="hover:text-primary transition-colors"
                    >
                      Contato
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact column */}
              <div className="space-y-4">
                <h4 className="font-semibold">Contato</h4>
                <div className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    <a
                      href="mailto:lptech.contato.labs@gmail.com"
                      className="hover:text-primary transition-colors"
                    >
                      lptech.contato.labs@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircleIcon className="h-4 w-4" />
                    <Link
                      href="/contato"
                      className="hover:text-primary transition-colors"
                    >
                      Fale com a gente
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex items-center justify-between border-t pt-8">
              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()}{" "}
                <span className="font-bold">Barber Lab</span>. Todos os direitos
                reservados.
              </p>

              <p>
                Desenvolvido por{" "}
                <Link
                  className="hover:text-primary flex items-center text-[#0077B5] transition-colors"
                  href="https://www.devstudio.com.br"
                >
                  DevStudio - Inovação Digital
                </Link>
              </p>
              <div className="text-muted-foreground flex items-center gap-6 text-sm">
                <Link
                  href="/privacidade"
                  className="hover:text-primary transition-colors"
                >
                  Privacidade
                </Link>
                <Link
                  href="/termos"
                  className="hover:text-primary transition-colors"
                >
                  Termos
                </Link>
                <Link
                  href="/cookies"
                  className="hover:text-primary transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </footer>
  )
}

export default Footer
