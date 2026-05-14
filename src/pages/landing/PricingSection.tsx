import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, scaleIn } from "./animations";

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
      icon: <Heart className="w-5 h-5 text-primary" />
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
      icon: <Sparkles className="w-5 h-5 text-primary" />
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
      icon: <Zap className="w-5 h-5 text-primary" />
    }
  ];

  return (
    <section className="w-full section-spacing bg-background relative overflow-hidden">
      <div className="app-container space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 block italic">Investimento Espiritual</span>
          <h2 className="font-display font-bold">Escolha seu Caminho de <span className="text-primary italic font-serif">Crescimento</span></h2>
          <p className="text-muted-foreground font-serif max-w-2xl mx-auto">
            Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas. (Mt 6,33)
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`desktop-card relative flex flex-col h-full ${
                tier.popular ? "border-secondary/20 bg-secondary/[0.02]" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-primary-foreground text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full">
                  Mais Escolhido
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold font-serif">{tier.name}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tier.desc}
                  </p>
                </div>

                <ul className="space-y-4 py-6 border-t border-border/10">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button 
                  className={`w-full h-12 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] ${
                    tier.popular ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted text-foreground"
                  }`}
                >
                  {tier.button}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
