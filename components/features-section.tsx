import { CheckCircle, DollarSign, LinkIcon, MessageSquare, ShoppingCart, Target } from "lucide-react"

const features = [
  {
    icon: CheckCircle,
    title: "Track Purchase Status",
    description: "Mark items as needed, in-progress, or purchased. See your progress at a glance.",
  },
  {
    icon: DollarSign,
    title: "Compare Prices",
    description: "Add multiple purchase options per item and find the best deal across stores.",
  },
  {
    icon: MessageSquare,
    title: "Add Notes",
    description: "Leave notes for yourself or your partner about specific items or options.",
  },
  {
    icon: Target,
    title: "Set Price Targets",
    description: "Track current, desired, and minimum prices to never overpay again.",
  },
  {
    icon: LinkIcon,
    title: "Store Links",
    description: "Save direct URLs to products for quick access when you're ready to buy.",
  },
  {
    icon: ShoppingCart,
    title: "Responsive Design",
    description: "Use it on your phone while shopping or on desktop for detailed planning.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
            Everything you need to furnish your home
          </h2>
          <p className="text-lg text-muted-foreground">
            From tracking what you need to finding the best prices, NestList has you covered.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
