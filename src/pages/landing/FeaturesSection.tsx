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
    <div
      className="desktop-card flex flex-col items-center text-center space-y-6 cursor-pointer group"
      onClick={() => onNavigate(feature.route)}
    >
      <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
        {React.cloneElement(feature.icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold">{feature.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
      </div>
    </div>
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
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 italic">O Caminho</span>
          <h2 className="font-display font-bold">Arquitetura do Conhecimento</h2>
          <p className="text-muted-foreground font-serif text-lg md:text-xl mx-auto">A luz de Cristo ilumina o coração.</p>
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
