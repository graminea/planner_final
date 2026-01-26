'use client'

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const footerLinks = {
  Produto: ["Funcionalidades", "Preços", "FAQ", "Roadmap"],
  Empresa: ["Sobre", "Blog", "Carreiras", "Contato"],
  Legal: ["Privacidade", "Termos", "Política de Cookies"],
}

export function Footer() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === 'figueira'

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="border-t border-border py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary relative overflow-hidden">
                {isFigueira ? (
                  <Image 
                    src="/figueirense/icon.png" 
                    alt="Figueirense" 
                    fill
                    className="text-primary-foreground object-contain p-1"
                  />
                ) : (
                  <Home className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <span className="text-xl font-semibold tracking-tight">Nossa listinha momooooo</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              O rastreador de compras de casa para casais. Planeje sua casa juntos, economize dinheiro e nunca compre em
              duplicata.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Nossa listinha momooooo. Todos os direitos reservados.</p>
          <p className="text-sm text-muted-foreground">Feito com amor para casais em todo lugar</p>
        </div>
      </div>
    </footer>
  )
}
