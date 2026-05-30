import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Sparkles, Hash } from "lucide-react";
import { AppRoute } from "@/types";
import { CathedraCard } from "@/components/cathedra/CathedraCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const features = [
  { 
    title: "Logos IA", 
    description: "Um mentor espiritual para os tempos modernos, treinado com o Magistério da Igreja.", 
    icon: <Sparkles className="h-lg w-lg" />, 
    route: AppRoute.DASHBOARD 
  },
  { 
    title: "Enciclopédia Católica", 
    description: "Lexicon Theologicum digital completo, navegável de A a Z.", 
    icon: <BookOpen className="h-lg w-lg" />, 
    route: AppRoute.ENCYCLOPEDIA 
  },
  { 
    title: "Bíblia Sagrada", 
    description: "Escrituras com ferramentas de estudo avançadas e busca inteligente.", 
    icon: <BookOpen className="h-lg w-lg" />, 
    route: AppRoute.BIBLE 
  },
  { 
    title: "Catecismo da Igreja", 
    description: "Doutrina cristã sistemática e orgânica, fiel ao Magistério.", 
    icon: <Hash className="h-lg w-lg" />, 
    route: AppRoute.CATECHISM 
  },
];

interface FeaturesSectionProps {
  onNavigate: (route: string) => void;
}

const FeatureCard = ({ feature, onNavigate }: { feature: typeof features[0]; onNavigate: (r: string) => void }) => {
  return (
    <CathedraCard
      as="button"
      variant="interactive"
      padding="none"
      className="p-xl flex flex-col items-center text-center space-y-lg group w-full appearance-none"
      onClick={() => onNavigate(feature.route)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(feature.route);
        }
      }}
      aria-label={`Explorar ${feature.title}`}
      role="button"
      tabIndex={0}
    >
      <div className="w-2xl h-2xl rounded-premium bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors" aria-hidden="true">
        {React.cloneElement(feature.icon as React.ReactElement, { className: "w-lg h-lg" })}
      </div>
      <div className="space-y-xs w-full">
        <h3 className="text-xl font-display font-bold text-center">{feature.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed text-center">{feature.description}</p>
      </div>
    </CathedraCard>
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
        <div className="text-center space-y-lg max-w-3xl mx-auto mb-3xl md:mb-4xl">
          <span className="text-xs font-bold uppercase tracking-[0.4em] text-primary/70 italic">O Caminho</span>
          <h2 className="font-display font-bold text-foreground">Arquitetura do Conhecimento</h2>
          <p className="text-muted-foreground/90 font-serif text-lg md:text-xl mx-auto">A luz de Cristo ilumina o coração.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl md:gap-xl">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
