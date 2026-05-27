import { motion, MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
}

const HeroBackground = ({ bgY }: HeroBackgroundProps) => (
  <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
    {/* Cinematic base layer - Deep Monastic Shadow */}
    <div className="absolute inset-0 bg-background" />
    
    {/* Spiritual Library Ambiance - Living background */}
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.15 }}
      transition={{ duration: 5 }}
      className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale opacity-10 mix-blend-soft-light" 
    />

    {/* Sacred Geometry Texture - Extremely subtle parchment pattern */}
    <div 
      className="absolute inset-0 opacity-[0.012] grayscale"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M80 0 L80 160 M0 80 L160 80' stroke='currentColor' stroke-width='0.3' fill='none'/%3E%3Cpath d='M40 40 L120 120 M120 40 L40 120' stroke='currentColor' stroke-width='0.15' fill='none'/%3E%3C/svg%3E")`,
        backgroundSize: '160px 160px'
      }}
    />
    
    {/* Chiaroscuro Lighting - Central Illumination Source */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,hsla(var(--primary)/0.045)_0%,transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,hsl(var(--background))_90%)] opacity-98" />
    
    {/* Atmospheric Depth - Soft Vignette */}
    <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background/80 opacity-60" />
    
    {/* Floating "Light Dust" - Cinematic focus */}
    <motion.div 
      animate={{ 
        opacity: [0.01, 0.03, 0.01],
        scale: [1, 1.05, 1]
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.02)_0%,transparent_100%)] mix-blend-overlay" 
    />
    
    {/* Framing Element - Elegant Border */}
    <div className="absolute inset-8 md:inset-16 lg:inset-24 border border-primary/[0.025] rounded-[4rem] pointer-events-none" />
  </motion.div>
);

export default HeroBackground;