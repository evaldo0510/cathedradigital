import { motion, useReducedMotion } from "framer-motion";

const HeroParticles = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px bg-primary/30 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-10%", "10%"],
            opacity: [0, 0.1, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 50 + Math.random() * 50, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 20
          }}
        />
      ))}
    </div>
  );
};

export default HeroParticles;