import { motion } from "framer-motion";

const HeroParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.5 
          }}
          animate={{ 
            y: [null, Math.random() * -50, Math.random() * 50],
            opacity: [0.1, 0.4, 0.1] 
          }}
          transition={{ 
            duration: 15 + Math.random() * 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      ))}
    </div>
  );
};

export default HeroParticles;