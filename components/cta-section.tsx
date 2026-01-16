import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative rounded-3xl bg-primary p-8 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('/abstract-warm-geometric-pattern-subtle.jpg')] opacity-10" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-primary-foreground text-balance">
              Pronto para começar a construir sua casa juntos?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Junte-se a milhares de casais que estão tornando sua experiência de mudança mais tranquila e econômica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" className="gap-2" asChild>
                <Link href="/register">
                  Comece grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60">Sem cartão de crédito • Grátis para sempre no uso básico</p>
          </div>
        </div>
      </div>
    </section>
  )
}
