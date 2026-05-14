import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp } from "./animations";
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
    <section className="w-full py-24 px-6 relative overflow-hidden bg-background">
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary/40">Comunidade</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold">Vozes da Comunidade</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border/5 shadow-sm space-y-6 flex flex-col"
            >
              <Quote className="w-6 h-6 text-primary/20" />
              <p className="text-sm text-muted-foreground leading-relaxed font-serif italic flex-1">
                "{t.text}"
              </p>

              <div className="pt-6 border-t border-border/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-xs">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;