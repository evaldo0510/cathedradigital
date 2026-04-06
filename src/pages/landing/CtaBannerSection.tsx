import { motion } from "framer-motion";
import { Church, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIn, buttonHover } from "./animations";

interface CtaBannerSectionProps {
  onStart: () => void;
}

const CtaBannerSection = ({ onStart }: CtaBannerSectionProps) => (
  <section className="w-full py-20 px-6">
    <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto text-center space-y-8 p-12 md:p-16 rounded-[3rem] bg-primary/5 border border-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      <div className="relative z-10 space-y-8">
        <Church className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
          Pronto para aprofundar sua <span className="text-primary italic">fé?</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Junte-se a milhares de fiéis que usam o Cathedra para crescer espiritualmente todos os dias.
        </p>
        <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap" className="inline-block">
          <Button size="lg" className="h-16 px-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/20 text-base" onClick={onStart}>
            Começar Agora <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  </section>
);

export default CtaBannerSection;
