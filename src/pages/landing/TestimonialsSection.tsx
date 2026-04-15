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
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <section className="w-full py-24 px-6 overflow-hidden bg-primary/5">
      <div className="max-w-7xl mx-auto space-y-16">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Vozes da Comunidade</h2>
          <p className="text-lg text-muted-foreground italic">O que dizem aqueles que caminham conosco</p>
        </motion.div>

        <div className="relative px-4 md:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((t, i) => (
                <CarouselItem key={t.name} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
                    className="h-full py-2"
                  >
                    <Card className="h-full border-none bg-card shadow-lg hover:shadow-2xl rounded-[2rem] overflow-hidden transition-shadow duration-300 relative group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      <CardContent className="p-8 space-y-6 relative h-full flex flex-col">
                        <motion.div
                          animate={{ rotate: [-6, 0, -6], scale: [0.8, 1, 0.8], opacity: [0.2, 0.35, 0.2] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute top-4 right-4"
                        >
                          <Quote className="w-12 h-12 text-primary/15" />
                        </motion.div>

                        <Quote className="w-8 h-8 text-primary/30" />
                        <p className="text-muted-foreground leading-relaxed font-serif italic relative z-10 flex-1">"{t.text}"</p>

                        <div className="space-y-4">
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
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
            
            {/* Mobile Controls */}
            <div className="flex justify-center gap-4 mt-10 md:hidden">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;