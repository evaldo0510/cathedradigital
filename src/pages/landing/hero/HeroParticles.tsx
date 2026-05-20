import { motion } from "framer-motion";

const HeroParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 mix-blend-screen">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[1px] h-[1px] bg-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.3)]"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.3 
          }}
          animate={{ 
            y: [null, Math.random() * -100, Math.random() * 100],
            opacity: [0.1, 0.4, 0.1] 
          }}
          transition={{ 
            duration: 20 + Math.random() * 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      ))}
    </div>
  );
};

export default HeroParticles;