import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0">
    <img
      src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=60&w=1200"
      alt="Catedral interior"
      className="w-full h-full object-cover opacity-[0.05] grayscale"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-background" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
  </motion.div>
);

export default HeroBackground;
