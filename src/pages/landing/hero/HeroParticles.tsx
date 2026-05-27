import { motion, useReducedMotion } from "framer-motion";

const HeroParticles = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.15]">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px bg-primary/40 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-5%", "5%"],
            opacity: [0, 0.08, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 60 + Math.random() * 60, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 30
          }}
        />
      ))}
    </div>
  );
};

export default HeroParticles;