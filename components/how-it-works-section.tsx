import Image from "next/image"

const steps = [
  {
    number: "01",
    title: "Adicione seus itens",
    description: "Crie uma lista de tudo que você precisa para sua nova casa. Organize por cômodo ou categoria.",
    image: "/mobile-app-showing-household-items-checklist-with-.jpg",
  },
  {
    number: "02",
    title: "Encontre os melhores preços",
    description: "Adicione opções de compra de diferentes lojas. Compare preços, frete e disponibilidade.",
    image: "/price-comparison-interface-showing-same-item-at-di.jpg",
  },
  {
    number: "03",
    title: "Acompanhe e compre",
    description: "Marque itens como comprados e veja sua nova casa tomando forma, um item de cada vez.",
    image: "/progress-dashboard-showing-completed-items-and-sav.jpg",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
            Passos simples para a casa dos seus sonhos
          </h2>
          <p className="text-lg text-muted-foreground">
            Comece em minutos e mantenha-se organizado durante toda a mudança.
          </p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${
                index % 2 === 1 ? "md:grid-flow-dense" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "md:col-start-2" : ""}>
                <div className="space-y-4">
                  <span className="text-5xl font-semibold text-primary/20">{step.number}</span>
                  <h3 className="text-2xl md:text-3xl font-semibold">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
              <div className={index % 2 === 1 ? "md:col-start-1" : ""}>
                <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
                  <Image
                    src={step.image || "/placeholder.svg"}
                    alt={step.title}
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
