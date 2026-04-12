import { motion } from "framer-motion";
import { Church, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIn, buttonHover } from "./animations";

interface CtaBannerSectionProps {
  onStart: () => void;
}

const CtaBannerSection = ({ onStart }: CtaBannerSectionProps) => (
  <section className="w-full py-20 px-6">
    <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto text-center space-y-8 p-12 md:p-16 rounded-[4rem] bg-card border border-primary/20 relative shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/20 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 opacity-60" />
      <div className="relative z-10 space-y-10">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <Church className="w-16 h-16 text-primary relative z-10" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight">
            Sua jornada de <span className="text-primary italic">fé</span> <br />
            começa aqui.
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto font-serif italic">
            "Não tenhas medo, pois Eu estou contigo." <br />
            <span className="text-base not-italic opacity-80 mt-2 block">
              Deixe o Logos guiar seus primeiros passos no estudo da Sagrada Tradição.
            </span>
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap" className="inline-block font-serif">
            <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(11,31,58,0.3)] text-lg border border-primary-foreground/10 group overflow-hidden" onClick={onStart}>
              <span className="relative z-10">Iniciar Diálogo Espiritual</span>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary/20 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </motion.div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
            Acesso totalmente gratuito · Inicie sua caminhada agora
          </p>
        </div>
      </div>
    </motion.div>
  </section>
);

export default CtaBannerSection;
