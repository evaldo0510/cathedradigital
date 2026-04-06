import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp, cardHover } from "./animations";

const testimonials = [
  { name: "Maria Fernanda", role: "Catequista", text: "O Cathedra transformou minha preparação para as aulas de catequese. Ter tudo num só lugar é uma bênção.", avatar: "MF" },
  { name: "Pe. Ricardo", role: "Pároco", text: "Recomendo aos meus paroquianos. A ferramenta de Lectio Divina e o Colloquium são excepcionais.", avatar: "PR" },
  { name: "João Paulo", role: "Seminarista", text: "Uso diariamente para estudar os documentos do Magistério. A busca inteligente economiza muito tempo.", avatar: "JP" },
];

const TestimonialsSection = () => (
  <section className="w-full py-24 px-6">
    <div className="max-w-6xl mx-auto space-y-16">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold">Vozes da Comunidade</h2>
        <p className="text-lg text-muted-foreground italic">O que dizem aqueles que caminham conosco</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} variants={cardHover} initial="rest" whileHover="hover" whileTap="tap">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} custom={i}>
              <Card className="h-full border-none bg-card shadow-lg rounded-[2rem] overflow-hidden cursor-default">
                <CardContent className="p-8 space-y-6">
                  <Quote className="w-8 h-8 text-primary/30" />
                  <p className="text-muted-foreground leading-relaxed font-serif italic">"{t.text}"</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
