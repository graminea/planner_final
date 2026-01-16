import { CheckCircle, DollarSign, LinkIcon, MessageSquare, ShoppingCart, Target } from "lucide-react"

const features = [
  {
    icon: CheckCircle,
    title: "Acompanhe Status de Compra",
    description: "Marque itens como necessários, em andamento ou comprados. Veja seu progresso rapidamente.",
  },
  {
    icon: DollarSign,
    title: "Compare Preços",
    description: "Adicione múltiplas opções de compra por item e encontre a melhor oferta entre lojas.",
  },
  {
    icon: MessageSquare,
    title: "Adicione Notas",
    description: "Deixe notas para você ou seu parceiro sobre itens ou opções específicas.",
  },
  {
    icon: Target,
    title: "Defina Metas de Preço",
    description: "Acompanhe preços atuais, desejados e mínimos para nunca pagar demais.",
  },
  {
    icon: LinkIcon,
    title: "Links de Lojas",
    description: "Salve URLs diretos dos produtos para acesso rápido quando estiver pronto para comprar.",
  },
  {
    icon: ShoppingCart,
    title: "Design Responsivo",
    description: "Use no celular enquanto faz compras ou no computador para planejamento detalhado.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
            Tudo que você precisa para mobiliar sua casa
          </h2>
          <p className="text-lg text-muted-foreground">
            De acompanhar o que você precisa até encontrar os melhores preços, o NestList tem você coberto.
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
