import { motion } from "framer-motion";

const HeroParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px bg-primary/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-20%", "20%"],
            opacity: [0, 0.15, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 40 + Math.random() * 40, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: Math.random() * 20
          }}
        />
      ))}
    </div>
  );
};

export default HeroParticles;

export default HeroParticles;