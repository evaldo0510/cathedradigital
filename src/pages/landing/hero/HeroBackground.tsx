import { motion, MotionValue, useReducedMotion } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div 
      style={{ y: shouldReduceMotion ? 0 : bgY }} 
      className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none"
    >
      {/* Cinematic base layer - Deep Monastic Shadow */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Spiritual Library Ambiance - Living background with parallax effect */}
      <motion.div 
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.1 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 2 : 8, ease: "easeOut" }}
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&auto=compress&cs=tinysrgb')] bg-cover bg-center grayscale mix-blend-luminosity" 
        style={{ contentVisibility: 'auto' }}
      />

      {/* Sacred Geometry Texture - Extremely subtle parchment pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] grayscale"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='240' height='240' viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0 L120 240 M0 120 L240 120' stroke='currentColor' stroke-width='0.4' fill='none'/%3E%3Cpath d='M60 60 L180 180 M180 60 L60 180' stroke='currentColor' stroke-width='0.2' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '240px 240px'
        }}
      />
      
      {/* Chiaroscuro Lighting - God-rays feeling / Central Illumination */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsla(var(--primary)/0.06)_0%,transparent_65%)]" />
      
      {/* Monastic Archway Vignette - Framing the entrance (Softer for less "black screen" feel) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsla(var(--background)/0.4)_70%,hsl(var(--background))_100%)]" />
      
      {/* Atmospheric Depth - Soft Cinematic Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background/90 opacity-70" />
      
      {/* Floating "Light Dust" - Cinematic focus particles */}
      {!shouldReduceMotion && (
        <motion.div 
          animate={{ 
            opacity: [0.01, 0.04, 0.01],
            scale: [1, 1.08, 1],
            rotate: [0, 1, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.03)_0%,transparent_100%)] mix-blend-overlay" 
        />
      )}
      
      {/* Framing Element - Refined Elegant Border */}
      <div className="absolute inset-spacing-lg md:inset-spacing-2xl lg:inset-spacing-3xl border border-primary/[0.03] rounded-[4rem] md:rounded-[6rem] pointer-events-none" />
    </motion.div>
  );
};

export default HeroBackground;