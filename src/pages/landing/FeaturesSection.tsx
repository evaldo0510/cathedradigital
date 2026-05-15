import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Sparkles, Hash } from "lucide-react";
import { AppRoute } from "@/types";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const features = [
  { 
    title: "Logos IA", 
    description: "Um mentor espiritual para os tempos modernos, treinado com o Magistério da Igreja.", 
    icon: <Sparkles className="h-6 w-6" />, 
    route: AppRoute.DASHBOARD 
  },
  { 
    title: "Enciclopédia Católica", 
    description: "Lexicon Theologicum digital completo, navegável de A a Z.", 
    icon: <BookOpen className="h-6 w-6" />, 
    route: AppRoute.ENCYCLOPEDIA 
  },
  { 
    title: "Bíblia Sagrada", 
    description: "Escrituras com ferramentas de estudo avançadas e busca inteligente.", 
    icon: <BookOpen className="h-6 w-6" />, 
    route: AppRoute.BIBLE 
  },
  { 
    title: "Catecismo da Igreja", 
    description: "Doutrina cristã sistemática e orgânica, fiel ao Magistério.", 
    icon: <Hash className="h-6 w-6" />, 
    route: AppRoute.CATECHISM 
  },
];

interface FeaturesSectionProps {
  onNavigate: (route: string) => void;
}

const FeatureCard = ({ feature, onNavigate }: { feature: typeof features[0]; onNavigate: (r: string) => void }) => {
  return (
    <Card
      variant="interactive"
      padding="lg"
      className="flex flex-col items-center text-center space-y-8 group w-full border-none"
      onClick={() => onNavigate(feature.route)}
    >
      <div className="w-20 h-20 rounded-premium-sm bg-primary/[0.02] flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-1000 border border-border/20 shadow-inner-soft" aria-hidden="true">
        {React.cloneElement(feature.icon as React.ReactElement, { className: "w-10 h-10", strokeWidth: 1 })}
      </div>
      <div className="space-y-4 w-full px-4">
        <h3 className="text-xl font-display font-bold text-center tracking-tight text-primary/80 group-hover:text-primary transition-colors">{feature.title}</h3>
        <p className="text-base text-muted-foreground leading-relaxed text-center font-serif italic opacity-60 group-hover:opacity-100 transition-opacity">{feature.description}</p>
      </div>
    </Card>
  );
};
FeatureCard.displayName = 'FeatureCard';

const FeaturesSection = ({ onNavigate }: FeaturesSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const decorY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={sectionRef} className="w-full section-spacing relative overflow-hidden">
      <div className="app-container relative z-10">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-20 md:mb-24">
          <span className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/70 italic">O Caminho</span>
          <h2 className="font-display font-bold text-foreground">Arquitetura do Conhecimento</h2>
          <p className="text-muted-foreground/90 font-serif text-lg md:text-xl mx-auto">A luz de Cristo ilumina o coração.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
