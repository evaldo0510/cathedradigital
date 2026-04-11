import { motion, MotionValue } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { buttonHover } from "../animations";

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
    className="relative z-10 max-w-5xl text-center space-y-8 sm:space-y-12 px-4"
  >
    {/* Logos Visual Highlight */}
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: EASE }}
      className="flex justify-center"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-colors duration-700 animate-pulse-slow" />
        <div className="relative p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-2xl border border-primary/20 shadow-2xl group-hover:border-primary/40 transition-all duration-500">
          <Icons.Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap border-[6px] border-background shadow-2xl"
        >
          Logos Inteligência Artificial
        </motion.div>
      </div>
    </motion.div>

    {/* Title */}
    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1] pt-4">
      <AnimatedTitle text="Como está a sua alma" />
      <br className="hidden sm:block" />
      <span className="inline sm:hidden">{" "}</span>
      <motion.span
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE }}
        className="text-primary italic font-light drop-shadow-sm inline-block font-serif text-[0.9em]"
      >
        hoje?
      </motion.span>
    </div>

    {/* Separator */}
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.8, delay: 2 }}
      className="w-32 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent mx-auto"
    />

    {/* Description */}
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 2.2 }}
      className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground font-serif italic leading-relaxed"
    >
      "A oração é o respirar da alma." <br />
      <span className="text-base md:text-lg not-italic opacity-80 block mt-2">
        Compartilhe suas reflexões com o Logos e receba uma orientação espiritual personalizada baseada na Sagrada Tradição.
      </span>
    </motion.p>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 2.5 }}
      className="flex flex-col items-center justify-center gap-6 pt-4"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
          <Button
            size="lg"
            className="h-20 px-16 rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(11,31,58,0.3)] text-lg relative overflow-hidden group border border-primary-foreground/10"
            onClick={onStart}
          >
            <span className="relative z-10 flex items-center gap-3">
              Escreva sua reflexão <Icons.PenTool className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary/20 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Button>
        </motion.div>
        <div className="flex items-center gap-2 opacity-60">
          <span className="w-8 h-px bg-muted-foreground/30" />
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            Comece sua jornada interior
          </p>
          <span className="w-8 h-px bg-muted-foreground/30" />
        </div>
      </div>

      <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm tracking-wide"
          onClick={onAbout}
        >
          Saiba como o Logos funciona
        </Button>
      </motion.div>
    </motion.div>
  </motion.div>
);

export default HeroContent;