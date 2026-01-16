import { Quote } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    quote: "We saved over $800 on our move-in purchases just by comparing prices. This app is a game-changer!",
    author: "Sarah & Mike",
    role: "Just moved into their first apartment",
    avatar: "/happy-young-couple-portrait-smiling.jpg",
  },
  {
    quote: "No more 'I thought you were getting that!' moments. We're finally on the same page.",
    author: "Jordan & Alex",
    role: "Engaged, moving in together",
    avatar: "/diverse-couple-portrait-warm-lighting.jpg",
  },
  {
    quote: "The price tracking feature helped us wait for the perfect deal on our dream couch.",
    author: "Emma & Chris",
    role: "Homeowners for 6 months",
    avatar: "/couple-in-their-30s-portrait-professional.jpg",
  },
]

export function TestimonialSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
            Loved by couples everywhere
          </h2>
          <p className="text-lg text-muted-foreground">See what other couples are saying about NestList.</p>
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
