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
    <section className="w-full py-24 px-6 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 block"
          >
            Investimento Espiritual
          </motion.span>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-4xl md:text-5xl font-display font-bold"
          >
            Escolha seu Caminho de <span className="text-primary italic font-serif">Crescimento</span>
          </motion.h2>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
            "Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas." (Mt 6,33)
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 2}
              whileHover={{ y: -10 }}
              className={`relative p-8 rounded-[3rem] bg-card border-2 flex flex-col h-full transition-all duration-500 ${
                tier.popular ? "border-primary shadow-2xl scale-105 z-10" : "border-border/50 hover:border-primary/20 shadow-lg"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                  Mais Escolhido
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold font-serif">{tier.name}</h3>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{tier.price}</span>
                    {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tier.desc}
                  </p>
                </div>

                <ul className="space-y-4 py-6 border-t border-border/30">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground/80 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button 
                  className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 ${
                    tier.popular ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted hover:bg-primary/10 text-foreground"
                  }`}
                >
                  {tier.button}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center pt-8"
        >
          <p className="text-sm text-muted-foreground">
            Tem dúvidas? <a href="#faq" className="text-primary font-bold hover:underline">Consulte nosso FAQ</a> ou fale com a irmandade.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
