import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0">
    <img
      src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=60&w=1200"
      alt="Catedral interior"
      className="w-full h-full object-cover opacity-[0.08] dark:opacity-[0.04] scale-100 blur-[3px]"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/70 to-background" />
    <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.02]" />
  </motion.div>
);

export default HeroBackground;
