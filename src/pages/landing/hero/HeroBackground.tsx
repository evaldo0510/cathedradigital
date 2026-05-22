import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 overflow-hidden">
    {/* Cinematic base layer */}
    <div className="absolute inset-0 bg-background" />
    
    {/* Subtle texture/image layer */}
    <img
      src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=2000"
      alt="" aria-hidden="true"
      className="w-full h-full object-cover opacity-[0.01] grayscale scale-100"
      loading="eager"
    />

    {/* Elegant light vignettes */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,hsl(var(--background))_80%)] opacity-60" />
    
    {/* Deep bottom transition */}
    <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-background via-background/80 to-transparent" />
  </motion.div>
);

export default HeroBackground;
