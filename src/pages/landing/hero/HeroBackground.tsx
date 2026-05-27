import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
    {/* Cinematic base layer */}
    <div className="absolute inset-0 bg-background transition-colors duration-1000" />
    
    {/* Atmospheric Texture - Elegant Monastic Pattern */}
    <div 
      className="absolute inset-0 opacity-[0.02] grayscale"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L50 100 M0 50 L100 50' stroke='currentColor' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px'
      }}
    />
    
    {/* Soft Cinematic Lighting - Centralized Focus */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.03)_0%,transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,hsl(var(--background))_85%)] opacity-90" />
    
    {/* Subtle Page-like Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/40" />
  </motion.div>
);

export default HeroBackground;