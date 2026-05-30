import { Church, ChevronRight } from "lucide-react";
import { HomeButton } from "@/components/cathedra/HomeButton";
import { CathedraCard } from "@/components/cathedra/CathedraCard";

interface CtaBannerSectionProps {
  onStart: () => void;
}

const CtaBannerSection = ({ onStart }: CtaBannerSectionProps) => (
  <section className="w-full section-spacing">
    <div className="app-container">
      <CathedraCard className="text-center space-y-10 py-3xl md:py-4xl relative overflow-hidden group border-primary/10">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        
        <div className="relative z-10 space-y-10">
          <div className="relative inline-flex items-center justify-center">
            <Church className="w-3xl h-3xl text-primary" />
          </div>
          <div className="space-y-4">
            <h2 className="font-display font-bold leading-tight text-foreground">
              Sua jornada de <span className="text-primary italic">fé</span> começa aqui.
            </h2>
            <p className="text-lg text-muted-foreground/90 max-w-lg mx-auto font-serif">
              "Não tenhas medo, pois Eu estou contigo."
            </p>
          </div>
          <div className="flex flex-col items-center gap-lg">
            <HomeButton 
              size="lg" 
              onClick={onStart}
              aria-label="Iniciar minha jornada agora"
            >
              Iniciar Minha Jornada
            </HomeButton>
            <p className="text-premium-tiny text-muted-foreground font-bold uppercase tracking-[0.4em] opacity-40">
              Acesso totalmente gratuito
            </p>
          </div>
        </div>
      </CathedraCard>
    </div>
  </section>
);

export default CtaBannerSection;
