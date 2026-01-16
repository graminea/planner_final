import { Quote } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    quote: "Economizamos mais de R$800 nas compras da mudança só comparando preços. Este app é revolucionário!",
    author: "Sara & Miguel",
    role: "Recém-mudados para o primeiro apartamento",
    avatar: "/happy-young-couple-portrait-smiling.jpg",
  },
  {
    quote: "Acabaram os momentos de 'achei que você ia comprar isso!'. Finalmente estamos na mesma página.",
    author: "Júlio & Ana",
    role: "Noivos, indo morar juntos",
    avatar: "/diverse-couple-portrait-warm-lighting.jpg",
  },
  {
    quote: "O rastreamento de preços nos ajudou a esperar a oferta perfeita para nosso sofá dos sonhos.",
    author: "Ema & Cristiano",
    role: "Donos de casa há 6 meses",
    avatar: "/couple-in-their-30s-portrait-professional.jpg",
  },
]

export function TestimonialSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
            Amado por casais em todo lugar
          </h2>
          <p className="text-lg text-muted-foreground">Veja o que outros casais estão dizendo sobre o NestList.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="p-6 rounded-xl bg-card border border-border">
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-foreground mb-6 leading-relaxed">{`"${testimonial.quote}"`}</p>
              <div className="flex items-center gap-3">
                <Image
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
