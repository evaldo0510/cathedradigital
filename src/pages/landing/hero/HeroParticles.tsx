import { motion } from "framer-motion";

const HeroParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 mix-blend-screen">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[1px] h-[1px] bg-primary/40 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.1 
          }}
          animate={{ 
            y: [null, Math.random() * -50, Math.random() * 50],
            opacity: [0.05, 0.2, 0.05] 
          }}
          transition={{ 
            duration: 30 + Math.random() * 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      ))}
    </div>
  );
};

export default HeroParticles;