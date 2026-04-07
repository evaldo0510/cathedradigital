import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp } from "./animations";

const testimonials = [
  { name: "Maria Fernanda", role: "Catequista", text: "O Cathedra transformou minha preparação para as aulas de catequese. Ter tudo num só lugar é uma bênção.", avatar: "MF", stars: 5 },
  { name: "Pe. Ricardo", role: "Pároco", text: "Recomendo aos meus paroquianos. A ferramenta de Lectio Divina e o Colloquium são excepcionais.", avatar: "PR", stars: 5 },
  { name: "João Paulo", role: "Seminarista", text: "Uso diariamente para estudar os documentos do Magistério. A busca inteligente economiza muito tempo.", avatar: "JP", stars: 5 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const floatingQuote = {
  initial: { rotate: -6, scale: 0.8, opacity: 0.2 },
  animate: {
    rotate: [-6, 0, -6],
    scale: [0.8, 1, 0.8],
    opacity: [0.2, 0.35, 0.2],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

const TestimonialsSection = () => (
  <section className="w-full py-24 px-6 overflow-hidden">
    <div className="max-w-6xl mx-auto space-y-16">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold">Vozes da Comunidade</h2>
        <p className="text-lg text-muted-foreground italic">O que dizem aqueles que caminham conosco</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8" style={{ perspective: "1200px" }}>
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={i}
            whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.3 } }}
            className="will-change-transform"
          >
            <Card className="h-full border-none bg-card shadow-lg hover:shadow-2xl rounded-[2rem] overflow-hidden transition-shadow duration-300 relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <CardContent className="p-8 space-y-6 relative">
                <motion.div variants={floatingQuote} initial="initial" animate="animate" className="absolute top-4 right-4">
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
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
