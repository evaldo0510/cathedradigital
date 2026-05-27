import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 overflow-hidden">
    {/* Cinematic base layer */}
    <div className="absolute inset-0 bg-background" />
    
    {/* Atmospheric Texture - Library/Monastic feel */}
    <img
      src="https://images.unsplash.com/photo-1549492423-400259a2e574?auto=format&fit=crop&q=80&w=2000"
      alt="" aria-hidden="true"
      className="w-full h-full object-cover opacity-[0.03] grayscale transition-opacity duration-1000"
      loading="eager"
    />

    {/* Soft Monastic Lighting */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,hsl(var(--background))_85%)] opacity-80" />
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,hsl(var(--background))_100%)] opacity-40" />
    
    {/* Subtle Inner Glow */}
    <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.02)]" />
  </motion.div>
);

export default HeroBackground;