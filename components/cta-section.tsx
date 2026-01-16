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
              Ready to start building your home together?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Join thousands of couples who are making their move-in experience smoother and more affordable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" className="gap-2">
                Get started for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60">No credit card required • Free forever for basic use</p>
          </div>
        </div>
      </div>
    </section>
  )
}
