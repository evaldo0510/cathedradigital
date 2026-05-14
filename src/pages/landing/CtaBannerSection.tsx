import { motion } from "framer-motion";
import { Church, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIn, buttonHover } from "./animations";

interface CtaBannerSectionProps {
  onStart: () => void;
}

const CtaBannerSection = ({ onStart }: CtaBannerSectionProps) => (
  <section className="w-full section-spacing px-6">
    <div className="desktop-card max-w-4xl mx-auto text-center space-y-10 py-16 md:py-24 relative overflow-hidden group">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
      
      <div className="relative z-10 space-y-10">
        <div className="relative inline-flex items-center justify-center">
          <Church className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl md:text-6xl font-display font-bold leading-tight">
            Sua jornada de <span className="text-primary italic">fé</span> começa aqui.
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto font-serif">
            "Não tenhas medo, pois Eu estou contigo."
          </p>
        </div>
        <div className="flex flex-col items-center gap-6">
          <Button 
            size="lg" 
            className="h-14 px-12 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs shadow-none" 
            onClick={onStart}
          >
            Iniciar Minha Jornada
          </Button>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em] opacity-40">
            Acesso totalmente gratuito
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default CtaBannerSection;
