import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Star, Clock, Users, ChevronRight, Sparkles, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AppRoute } from "@/types";

const features = [
  { 
    title: "Logos IA", 
    description: "Um mentor espiritual para os tempos modernos, pronto para caminhar ao seu lado no estudo do Magistério e na oração.", 
    benefit: "Encontre respostas que aquecem o coração e iluminam a inteligência com a sabedoria da Igreja.", 
    icon: <Sparkles className="h-6 w-6" />, 
    route: AppRoute.DASHBOARD 
  },
  { 
    title: "Enciclopédia Católica", 
    description: "Um Lexicon Theologicum digital completo, navegável de A a Z, com definições profundas e conexões bíblicas.", 
    benefit: "Acesse o conhecimento da Tradição de forma independente, gratuita e estruturada para todos.", 
    icon: <BookOpen className="h-6 w-6" />, 
    route: AppRoute.ENCYCLOPEDIA 
  },
  { 
    title: "Navegação por Temas", 
    description: "Explore conexões sagradas entre Bíblia, Catecismo e Magistério através de uma interface intuitiva de bolhas teológicas.", 
    benefit: "Aprofunde-se em conceitos fundamentais da fé com uma visão 360 graus da Tradição.", 
    icon: <Hash className="h-6 w-6" />, 
    route: AppRoute.TEMAS 
  },
  { 
    title: "Bíblia Sagrada", 
    description: "Acesse as Escrituras com ferramentas de estudo avançadas, anotações pessoais e busca inteligente por temas.", 
    benefit: "Mergulhe na Palavra de Deus e guarde os versículos que transformam sua vida.", 
    icon: <BookOpen className="h-6 w-6" />, 
    route: AppRoute.BIBLE 
  },
  { 
    title: "Liturgia Diária", 
    description: "Siga as leituras da Santa Missa, conheça o santo do dia e medite com orações próprias de cada tempo.", 
    benefit: "Viva o ritmo espiritual da Igreja em comunhão com fiéis do mundo inteiro.", 
    icon: <Clock className="h-6 w-6" />, 
    route: AppRoute.LITURGIA 
  },
  { 
    title: "Jornadas de Fé", 
    description: "Trilhas de formação espiritual desenhadas para converter seu conhecimento em vivência cristã autêntica.", 
    benefit: "Um caminho seguro de maturidade espiritual através do estudo e da oração.", 
    icon: <Star className="h-6 w-6" />, 
    route: AppRoute.JORNADAS 
  },
];

interface FeaturesSectionProps {
  onNavigate: (route: string) => void;
}

const FeatureCard = React.forwardRef<HTMLDivElement, { feature: typeof features[0]; index: number; onNavigate: (r: string) => void }>(({ feature, index, onNavigate }, ref) => {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isLeft ? -60 : 60, rotateY: isLeft ? 8 : -8 }}
      whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card
          className="group h-full border-none bg-card shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col cursor-pointer relative lg:rounded-[2rem]"
          onClick={() => onNavigate(feature.route)}
        >
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-primary/5 transition-all duration-700 rounded-[2.5rem]" />

          <CardHeader className="space-y-4 relative z-10">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 relative"
            >
              {feature.icon}
              {/* Pulse ring on hover */}
              <div className="absolute inset-0 rounded-3xl border-2 border-primary/0 group-hover:border-primary/30 group-hover:scale-125 transition-all duration-700 opacity-0 group-hover:opacity-100" />
            </motion.div>
            <CardTitle className="text-2xl font-serif">
              {feature.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col relative z-10">
            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            <div className="p-4 bg-muted/30 rounded-2xl border border-primary/5 italic text-sm text-primary/80">
              <strong>Impacto:</strong> {feature.benefit}
            </div>
            <Button variant="ghost" className="w-full mt-auto justify-between group/btn text-xs font-black uppercase tracking-[0.2em]">
              Acessar Agora
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
});
FeatureCard.displayName = 'FeatureCard';

const FeaturesSection = ({ onNavigate }: FeaturesSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const decorY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={sectionRef} className="w-full max-w-7xl px-6 py-24 space-y-20 relative overflow-hidden">
      {/* Parallax decorative blurs */}
      <motion.div style={{ y: decorY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/5 blur-[80px]" />
      </motion.div>

      {/* Section header with reveal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="text-center space-y-6 max-w-3xl mx-auto relative z-10"
      >
        <motion.span
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 block"
        >
          Experiência
        </motion.span>
        <h2 className="text-4xl md:text-6xl font-display font-bold">Aprofunde sua Vida Interior</h2>
        <p className="text-lg text-muted-foreground italic">"Conhecereis a verdade, e a verdade vos libertará" (Jo 8,32)</p>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-24 h-1.5 bg-primary mx-auto rounded-full origin-center"
        />
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {features.map((feature, idx) => (
          <FeatureCard key={feature.title} feature={feature} index={idx} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
