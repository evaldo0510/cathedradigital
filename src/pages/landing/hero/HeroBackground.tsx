import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0">
    <img
      src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=60&w=1200"
      alt="" aria-hidden="true"
      className="w-full h-full object-cover opacity-[0.02] grayscale"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-background/20" />
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-background" />
  </motion.div>
);

export default HeroBackground;
