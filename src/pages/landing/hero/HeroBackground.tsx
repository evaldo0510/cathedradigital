import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background z-10" />
    <img
      src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=60&w=1200"
      alt="" aria-hidden="true"
      className="w-full h-full object-cover opacity-[0.03] grayscale transition-opacity duration-1000"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-background/40 z-[5]" />
  </motion.div>
);

export default HeroBackground;
