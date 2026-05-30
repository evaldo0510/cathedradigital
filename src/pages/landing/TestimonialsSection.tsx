import { Quote } from "lucide-react";
import { CathedraCard } from "@/components/cathedra/CathedraCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

const testimonials = [
  { name: "Maria Fernanda", role: "Catequista", text: "O Cathedra transformou minha preparação para as aulas de catequese. Ter tudo num só lugar é uma bênção.", avatar: "MF", stars: 5 },
  { name: "Pe. Ricardo", role: "Pároco", text: "Recomendo aos meus paroquianos. A ferramenta de Lectio Divina e o Logos IA são excepcionais.", avatar: "PR", stars: 5 },
  { name: "João Paulo", role: "Seminarista", text: "Uso diariamente para estudar os documentos do Magistério. A busca inteligente economiza muito tempo.", avatar: "JP", stars: 5 },
  { name: "Ana Clara", role: "Professora de Teologia", text: "A profundidade do conteúdo é impressionante. É como ter uma biblioteca patrística inteira no bolso.", avatar: "AC", stars: 5 },
  { name: "Diác. Marcos", role: "Diácono Permanente", text: "O Breviário e o Missal integrados facilitaram muito minha preparação para as celebrações litúrgicas.", avatar: "DM", stars: 5 },
  { name: "Teresa de Jesus", role: "Leiga Consagrada", text: "A Via Sacra e o Rosário guiados me ajudam a manter a vida de oração mesmo nos dias mais corridos.", avatar: "TJ", stars: 5 },
];

const TestimonialsSection = () => {
  return (
    <section className="w-full section-spacing relative overflow-hidden bg-background">
      <div className="app-container space-y-spacing-3xl relative z-10">
        <div className="text-center space-y-spacing-lg">
          <span className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60 italic">Comunidade</span>
          <h2 className="font-display font-bold">Vozes da Comunidade</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-xl md:gap-spacing-xl">
          {testimonials.slice(0, 3).map((t) => (
            <CathedraCard
              key={t.name}
              className="p-spacing-xl space-y-spacing-xl flex flex-col"
            >
              <Quote className="w-spacing-lg h-spacing-lg text-secondary/20" />
              <p className="text-premium-base text-muted-foreground leading-relaxed font-serif flex-1">
                "{t.text}"
              </p>

              <div className="pt-spacing-xl border-t border-border/10 flex items-center gap-spacing-md">
                <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 flex items-center justify-center text-primary font-bold text-premium-small">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-premium-small">{t.name}</p>
                  <p className="text-premium-xs text-muted-foreground uppercase tracking-wider font-bold">{t.role}</p>
                </div>
              </div>
            </CathedraCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;