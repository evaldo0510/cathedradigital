import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonHover } from "./animations";
import cathedraLogo from "@/assets/cathedra-logo.webp";

interface HeroSectionProps {
  onStart: () => void;
  onAbout: () => void;
}

const letterVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.6, delay: 0.8 + i * 0.04, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const AnimatedTitle = ({ text, className }: { text: string; className?: string }) => (
  <span className={className}>
    {text.split("").map((char, i) => (
      <motion.span
        key={i}
        variants={letterVariants}
        initial="hidden"
        animate="visible"
        custom={i}
        className="inline-block"
        style={{ display: char === " " ? "inline" : "inline-block" }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </span>
);

const HeroSection = ({ onStart, onAbout }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={heroRef} className="relative w-full min-h-[100vh] flex items-center justify-center px-6 overflow-hidden">
      {/* Background with parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=40&w=800"
          alt="Catedral interior com vitrais"
          className="w-full h-full object-cover opacity-10 dark:opacity-[0.06] scale-110 blur-[2px]"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.02]" />
      </motion.div>

      {/* Floating ornamental particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 max-w-5xl text-center space-y-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.25em]">O Santuário Digital da Fé</span>
        </motion.div>

        {/* Logo reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <motion.img
            src={cathedraLogo}
            alt="Cathedra"
            className="w-20 h-20 md:w-28 md:h-28 object-contain"
            animate={{
              filter: [
                "drop-shadow(0 0 15px hsl(43 72% 53% / 0.2))",
                "drop-shadow(0 0 30px hsl(43 72% 53% / 0.4))",
                "drop-shadow(0 0 15px hsl(43 72% 53% / 0.2))",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Title with letter-by-letter animation */}
        <div className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1] lg:text-7xl">
          <AnimatedTitle text="Aprofunde sua fé" />
          <br className="hidden sm:block" />
          <span className="inline sm:hidden">{" "}</span>
          <AnimatedTitle text="e" />
          {" "}
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-primary italic font-light drop-shadow-sm inline-block"
          >
            Sinta-se em Casa.
          </motion.span>
        </div>

        {/* Decorative separator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent mx-auto"
        />

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
          className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground font-serif italic"
        >
          "A oração é a elevação da alma a Deus." <br />
          <span className="text-base md:text-lg not-italic opacity-80">
            Explore a Bíblia, o Catecismo e a tradição católica em uma plataforma unificada e acolhedora.
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6"
        >
          <div className="flex flex-col items-center gap-3">
            <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
              <Button
                size="lg"
                className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/30 text-base relative overflow-hidden group"
                onClick={onStart}
              >
                <span className="relative z-10 flex items-center">
                  Começar Jornada <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </Button>
            </motion.div>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
              Acesso gratuito · Sem cartão
            </p>
          </div>

          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button
              size="lg"
              variant="outline"
              className="h-16 px-12 rounded-2xl border-primary/20 bg-card/50 backdrop-blur-md font-black uppercase tracking-widest text-base hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={onAbout}
            >
              Conhecer o Projeto
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <motion.span
          className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Explorar
        </motion.span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-muted-foreground/30"
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
