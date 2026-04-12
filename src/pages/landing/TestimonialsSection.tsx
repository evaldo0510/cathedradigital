import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp } from "./animations";
import { useState, useEffect, useCallback } from "react";

const testimonials = [
  { name: "Maria Fernanda", role: "Catequista", text: "O Cathedra transformou minha preparação para as aulas de catequese. Ter tudo num só lugar é uma bênção.", avatar: "MF", stars: 5 },
  { name: "Pe. Ricardo", role: "Pároco", text: "Recomendo aos meus paroquianos. A ferramenta de Lectio Divina e o Logos IA são excepcionais.", avatar: "PR", stars: 5 },
  { name: "João Paulo", role: "Seminarista", text: "Uso diariamente para estudar os documentos do Magistério. A busca inteligente economiza muito tempo.", avatar: "JP", stars: 5 },
  { name: "Ana Clara", role: "Professora de Teologia", text: "A profundidade do conteúdo é impressionante. É como ter uma biblioteca patrística inteira no bolso.", avatar: "AC", stars: 5 },
  { name: "Diác. Marcos", role: "Diácono Permanente", text: "O Breviário e o Missal integrados facilitaram muito minha preparação para as celebrações litúrgicas.", avatar: "DM", stars: 5 },
  { name: "Teresa de Jesus", role: "Leiga Consagrada", text: "A Via Sacra e o Rosário guiados me ajudam a manter a vida de oração mesmo nos dias mais corridos.", avatar: "TJ", stars: 5 },
];

const ITEMS_PER_PAGE_DESKTOP = 3;
const AUTO_PLAY_INTERVAL = 5000;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const TestimonialsSection = () => {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const totalPages = Math.ceil(testimonials.length / ITEMS_PER_PAGE_DESKTOP);

  const paginate = useCallback((newDir: number) => {
    setDirection(newDir);
    setPage((prev) => (prev + newDir + totalPages) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    const timer = setInterval(() => paginate(1), AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [paginate]);

  const currentItems = testimonials.slice(
    page * ITEMS_PER_PAGE_DESKTOP,
    page * ITEMS_PER_PAGE_DESKTOP + ITEMS_PER_PAGE_DESKTOP
  );

  return (
    <section className="w-full py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Vozes da Comunidade</h2>
          <p className="text-lg text-muted-foreground italic">O que dizem aqueles que caminham conosco</p>
        </motion.div>

        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={() => paginate(-1)}
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="grid md:grid-cols-3 gap-8"
              style={{ perspective: "1200px" }}
            >
              {currentItems.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.3 } }}
                  className="will-change-transform"
                >
                  <Card className="h-full border-none bg-card shadow-lg hover:shadow-2xl rounded-[2rem] overflow-hidden transition-shadow duration-300 relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    <CardContent className="p-8 space-y-6 relative">
                      <motion.div
                        animate={{ rotate: [-6, 0, -6], scale: [0.8, 1, 0.8], opacity: [0.2, 0.35, 0.2] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" as const }}
                        className="absolute top-4 right-4"
                      >
                        <Quote className="w-12 h-12 text-primary/15" />
                      </motion.div>

                      <Quote className="w-8 h-8 text-primary/30" />
                      <p className="text-muted-foreground leading-relaxed font-serif italic relative z-10">"{t.text}"</p>

                      <div className="flex gap-0.5">
                        {Array.from({ length: t.stars }).map((_, si) => (
                          <Star key={si} className="w-4 h-4 fill-primary text-primary" />
                        ))}
                      </div>

                      <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          {t.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > page ? 1 : -1); setPage(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${i === page ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                aria-label={`Página ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
