import { motion, useReducedMotion } from "framer-motion";

const HeroParticles = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.15]">
      {[...Array(4)].map((_, i) => {
        const xPos = (i * 25 + 12) + "%";
        const yPos = (i * 15 + 20) + "%";
        return (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-primary/40 rounded-premium-full"
            initial={{ 
              x: xPos, 
              y: yPos,
              opacity: 0 
            }}
            animate={{ 
              y: [null, "-5%", "5%"],
              opacity: [0, 0.08, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 60 + (i * 10), 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 5
            }}
          />
        );
      })}
    </div>
  );
};

export default HeroParticles;