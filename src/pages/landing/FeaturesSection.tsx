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
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="p-8 rounded-3xl bg-card border border-border/5 group hover:border-primary/10 transition-all cursor-pointer flex flex-col items-center text-center space-y-4 shadow-sm"
      onClick={() => onNavigate(feature.route)}
    >
      <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-2">
        {feature.icon}
      </div>
      <h3 className="text-xl font-display font-bold">
        {feature.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
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
    <section ref={sectionRef} className="w-full max-w-7xl px-6 py-24 space-y-20 relative overflow-hidden">
      {/* Parallax decorative blurs */}
      <motion.div style={{ y: decorY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/5 blur-[80px]" />
      </motion.div>

      {/* Section header with reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center space-y-4 max-w-2xl mx-auto relative z-10"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary/40 italic">O Caminho</span>
        <h2 className="text-3xl md:text-4xl font-display font-bold">Arquitetura do Conhecimento</h2>
        <p className="text-muted-foreground font-serif">A luz de Cristo ilumina o coração.</p>
      </motion.div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 max-w-6xl mx-auto">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
