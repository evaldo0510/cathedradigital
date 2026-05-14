import { motion } from "framer-motion";
import { Church, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIn, buttonHover } from "./animations";

interface CtaBannerSectionProps {
  onStart: () => void;
}

const CtaBannerSection = ({ onStart }: CtaBannerSectionProps) => (
  <section className="w-full py-20 px-6">
    <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto text-center space-y-8 p-12 md:p-16 rounded-3xl bg-card border border-border/10 relative shadow-sm overflow-hidden group">
      <div className="relative z-10 space-y-8">
        <div className="relative inline-flex items-center justify-center">
          <Church className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
            Sua jornada de <span className="text-primary italic">fé</span> começa aqui.
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto font-serif">
            Não tenhas medo, pois Eu estou contigo.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            className="h-14 px-12 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs shadow-none" 
            onClick={onStart}
          >
            Iniciar Minha Jornada
          </Button>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
            Acesso totalmente gratuito
          </p>
        </div>
      </div>
    </motion.div>
  </section>
);

export default CtaBannerSection;
