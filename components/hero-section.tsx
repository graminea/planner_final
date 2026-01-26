'use client'

import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === 'figueira'

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/30 text-accent-foreground text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              Para casais que vão morar juntos
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.1]">
              Planeje sua casa, <span className="text-primary">juntos</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Acompanhe itens de casa, compare preços em diferentes lojas e coordene compras com seu parceiro. Montar a casa
              nunca foi tão organizado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/register">
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">Veja como funciona</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              {["Rastreie itens juntos", "Compare preços de lojas", "Nunca compre em duplicata"].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {isFigueira && (
              <div className="absolute -top-8 -right-8 z-20 mascot-container">
                <div className="relative w-36 h-36 -ml-2">
                  <Image 
                    src="/figueirense/mascot.png" 
                    alt="Figueirense" 
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            )}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
              <Image
                src="/modern-cozy-living-room-with-couple-unpacking-boxe.jpg"
                alt="Couple setting up their new home together"
                width={500}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xl"></span>
                </div>
                <div>
                  <p className="font-medium text-sm">Sofá da Sala</p>
                  <p className="text-xs text-muted-foreground">Encontrado em 3 lojas</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-card rounded-xl p-4 shadow-lg border border-border">
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">R$2.340</p>
                <p className="text-xs text-muted-foreground">economizados este mês</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
