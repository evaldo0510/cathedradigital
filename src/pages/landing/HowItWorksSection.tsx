import { motion } from "framer-motion";
import { Sparkles, Cross, Flame } from "lucide-react";
import { fadeUp } from "./animations";

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Registro rápido e gratuito para começar sua jornada espiritual.", icon: <Sparkles className="h-6 w-6" /> },
  { num: "02", title: "Escolha seu caminho", desc: "Bíblia, Catecismo, Santos ou orações — comece por onde o coração pedir.", icon: <Cross className="h-6 w-6" /> },
  { num: "03", title: "Aprofunde-se diariamente", desc: "Mantenha sua streak, ganhe badges e cresça na fé com constância.", icon: <Flame className="h-6 w-6" /> },
];

const HowItWorksSection = () => (
  <section className="w-full py-24 px-6 bg-muted/30 border-y border-border/20">
    <div className="max-w-5xl mx-auto space-y-16">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold">Como Funciona</h2>
        <p className="text-lg text-muted-foreground italic max-w-xl mx-auto">Três passos simples para iniciar sua transformação espiritual</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 md:gap-12">
        {steps.map((step, i) => (
          <motion.div key={step.num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} custom={i} className="relative text-center space-y-6">
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
            )}
            <motion.div whileHover={{ scale: 1.1, rotate: -5 }} transition={{ type: "spring", stiffness: 300 }} className="w-24 h-24 mx-auto rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary">
              {step.icon}
            </motion.div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">{step.num}</span>
            <h3 className="text-xl font-serif font-bold">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
