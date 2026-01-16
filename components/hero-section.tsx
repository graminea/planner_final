import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/30 text-accent-foreground text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              For couples moving in together
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.1]">
              Plan your home, <span className="text-primary">together</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Track household items, compare prices across stores, and coordinate purchases with your partner. Moving in
              has never been this organized.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2">
                Start tracking free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              {["Track items together", "Compare store prices", "Never double-buy"].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
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
                  <span className="text-xl">🛋️</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Living Room Sofa</p>
                  <p className="text-xs text-muted-foreground">Found at 3 stores</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-card rounded-xl p-4 shadow-lg border border-border">
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">$2,340</p>
                <p className="text-xs text-muted-foreground">saved this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
