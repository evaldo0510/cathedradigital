import { Check, Sparkles, Zap, Heart } from "lucide-react";
import { HomeButton } from "@/components/cathedra/HomeButton";
import { CathedraCard } from "@/components/cathedra/CathedraCard";

const PricingSection = () => {
  const tiers = [
    {
      name: "Filho Pródigo",
      price: "Grátis",
      desc: "O essencial para quem está começando sua caminhada.",
      features: [
        "Bíblia Sagrada Completa",
        "Catecismo da Igreja (CIC)",
        "Liturgia Diária & Santo do Dia",
        "Orações e Devoções Básicas",
        "3 Consultas/dia ao Logos IA"
      ],
      button: "Começar Agora",
      popular: false,
      icon: <Heart className="w-md h-md text-primary" />
    },
    {
      name: "Irmandade Premium",
      price: "R$ 19,90",
      period: "/mês",
      desc: "Aprofundamento total com recursos avançados de IA.",
      features: [
        "Tudo do plano Grátis",
        "Logos IA Ilimitado",
        "Análises Teológicas Profundas",
        "Jornadas de Fé Exclusivas",
        "Comunidade & Grupos de Estudo",
        "Acesso Antecipado a Recursos"
      ],
      button: "Ser Premium",
      popular: true,
      icon: <Sparkles className="w-md h-md text-primary" />
    },
    {
      name: "Benfeitor Anual",
      price: "R$ 197,00",
      period: "/ano",
      desc: "Apoie a missão e economize dois meses de assinatura.",
      features: [
        "Tudo do plano Premium",
        "Badge Exclusiva de Benfeitor",
        "Mural de Agradecimentos",
        "Vigílias Mensais Online",
        "Apoio Direto à Evangelização"
      ],
      button: "Apoiar a Missão",
      popular: false,
      icon: <Zap className="w-md h-md text-primary" />
    }
  ];

  return (
    <section className="w-full section-spacing bg-background relative overflow-hidden">
      <div className="app-container space-y-3xl">
        <div className="text-center space-y-lg max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.4em] text-primary/70 block italic">Investimento Espiritual</span>
          <h2 className="font-display font-bold text-foreground">Escolha seu Caminho de <span className="text-primary italic font-serif">Crescimento</span></h2>
          <p className="text-muted-foreground/90 font-serif max-w-2xl mx-auto">
            Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas. (Mt 6,33)
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-xl md:gap-xl">
          {tiers.map((tier) => (
            <CathedraCard
              key={tier.name}
              className={`p-xl relative flex flex-col h-full ${
                tier.popular ? "border-secondary/20 bg-secondary/[0.02]" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-sm left-2xs/2 -translate-x-1/2 bg-secondary text-primary-foreground text-xs font-bold uppercase tracking-[0.3em] px-md py-2xs rounded-premium">
                  Mais Escolhido
                </div>
              )}

              <div className="space-y-lg flex-1">
                <div className="flex justify-between items-center">
                  <div className="w-2xl h-2xl rounded-premium bg-primary/5 flex items-center justify-center">
                    {tier.icon}
                  </div>
                  <h3 className="font-bold font-serif">{tier.name}</h3>
                </div>

                <div className="space-y-xs">
                  <div className="flex items-baseline gap-2xs">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.period && <span className="text-muted-foreground text-premium-small">{tier.period}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tier.desc}
                  </p>
                </div>

                <ul className="space-y-md py-lg border-t border-border/10">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-sm text-premium-small">
                      <Check className="w-md h-md text-secondary mt-3xs flex-shrink-0" />
                      <span className="text-muted-foreground leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-xl">
                <HomeButton 
                  variant={tier.popular ? "primary" : "outline"}
                  className="w-full"
                  aria-label={`Assinar o plano ${tier.name}`}
                >
                  {tier.button}
                </HomeButton>
              </div>
            </CathedraCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
