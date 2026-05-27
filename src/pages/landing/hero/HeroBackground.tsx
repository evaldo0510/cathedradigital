import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
    {/* Cinematic base layer */}
    <div className="absolute inset-0 bg-background" />
    
    {/* Atmospheric Texture - Elegant Monastic Pattern */}
    <div 
      className="absolute inset-0 opacity-[0.015] grayscale"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0 L60 120 M0 60 L120 60' stroke='currentColor' stroke-width='0.4' fill='none'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 120px'
      }}
    />
    
    {/* Soft Cinematic Lighting - Sophisticated Chiaroscuro */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,hsl(var(--background))_90%)] opacity-95" />
    
    {/* Subtle Inner Border - Frame-like feel */}
    <div className="absolute inset-10 border border-primary/[0.02] rounded-[2rem] pointer-events-none" />
  </motion.div>
);

export default HeroBackground;