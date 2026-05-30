import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Cross, Flame } from "lucide-react";

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Registro rápido e gratuito para começar sua jornada espiritual.", icon: <Sparkles className="h-md w-md" /> },
  { num: "02", title: "Escolha seu caminho", desc: "Bíblia, Catecismo, Santos ou orações — comece por onde o coração pedir.", icon: <Cross className="h-md w-md" /> },
  { num: "03", title: "Aprofunde-se diariamente", desc: "Mantenha sua streak, ganhe badges e cresça na fé com constância.", icon: <Flame className="h-md w-md" /> },
];

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineWidth = useTransform(scrollYProgress, [0.2, 0.6], ["0%", "100%"]);

  return (
    <section ref={sectionRef} className="w-full py-4xl px-lg bg-muted/30 border-y border-border/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center space-y-4"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-premium-tiny font-black uppercase tracking-[0.4em] text-primary/60 block italic"
          >
            Passo a passo
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-display font-bold">Como Funciona</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">Três passos simples para iniciar sua transformação espiritual</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-xl md:gap-2xl relative">
          {/* Animated connecting line */}
          <div className="hidden md:block absolute top-2xl left-[16%] right-[16%] h-px bg-border/30">
            <motion.div
              style={{ width: lineWidth }}
              className="h-full bg-primary/40"
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.2,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              className="relative text-center space-y-6"
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-3xl h-3xl mx-auto rounded-[1.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary relative z-10"
              >
                {step.icon}
                {/* Step number badge */}
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.2, type: "spring", stiffness: 500 }}
                  className="absolute -top-xs -right-xs w-lg h-lg rounded-full bg-primary text-primary-foreground text-premium-tiny font-black flex items-center justify-center border border-primary/20"
                >
                  {step.num}
                </motion.span>
              </motion.div>
              <h3 className="text-xl font-serif font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
