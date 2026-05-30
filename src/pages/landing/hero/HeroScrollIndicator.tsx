import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const HeroScrollIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2, duration: 1 }}
    className="absolute bottom-2xl left-2xs/2 -translate-x-1/2 z-10 flex flex-col items-center gap-md"
  >
    <motion.div
      animate={{ 
        y: [0, 8, 0],
        opacity: [0.1, 0.3, 0.1]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 4, 
        ease: "easeInOut" 
      }}
      className="flex flex-col items-center gap-xs"
    >
      <div className="w-px h-2xl bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0" />
    </motion.div>
  </motion.div>
);

export default HeroScrollIndicator;
