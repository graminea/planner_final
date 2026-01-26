import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { FigueiraWatermark } from "@/components/FigueiraWatermark"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <FigueiraWatermark />
      <div className="relative z-10">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <TestimonialSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
