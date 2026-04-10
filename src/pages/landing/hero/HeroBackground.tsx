import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0">
    <img
      src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=40&w=800"
      alt="Catedral interior com vitrais"
      className="w-full h-full object-cover opacity-10 dark:opacity-[0.06] scale-110 blur-[2px]"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/70 to-background" />
    <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.02]" />
  </motion.div>
);

export default HeroBackground;
