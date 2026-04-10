import { motion, MotionValue } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonHover } from "../animations";
import cathedraLogo from "@/assets/cathedra-logo.webp";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const letterVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -60 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.6, delay: 0.8 + i * 0.04, ease: EASE },
  }),
};

const AnimatedTitle = ({ text }: { text: string }) => (
  <span>
    {text.split("").map((char, i) => (
      <motion.span
        key={i}
        variants={letterVariants}
        initial="hidden"
        animate="visible"
        custom={i}
        className="inline-block font-serif"
        style={{ display: char === " " ? "inline" : "inline-block" }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </span>
);

interface HeroContentProps {
  heroOpacity: MotionValue<number>;
  heroScale: MotionValue<number>;
  heroY: MotionValue<number>;
  onStart: () => void;
  onAbout: () => void;
}

const HeroContent = ({ heroOpacity, heroScale, heroY, onStart, onAbout }: HeroContentProps) => (
  <motion.div
    style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
    className="relative z-10 max-w-5xl text-center space-y-10"
  >
    {/* Badge */}
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary backdrop-blur-sm"
    >
      <Sparkles className="w-4 h-4" />
      <span className="text-xs font-black uppercase tracking-[0.25em]">O Santuário Digital da Fé</span>
    </motion.div>

    {/* Logo */}
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: EASE }}
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

    {/* Title */}
    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.15]">
      <AnimatedTitle text="Aprofunde sua fé" />
      <br className="hidden sm:block" />
      <span className="inline sm:hidden">{" "}</span>
      <AnimatedTitle text="e" />
      {" "}
      <motion.span
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE }}
        className="text-primary italic font-light drop-shadow-sm inline-block font-serif text-[0.85em]"
      >
        Sinta-se em Casa.
      </motion.span>
    </div>

    {/* Separator */}
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

    {/* CTA */}
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
            <motion.div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
);

export default HeroContent;
