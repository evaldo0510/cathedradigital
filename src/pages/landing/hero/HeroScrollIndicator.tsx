import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const HeroScrollIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 3 }}
    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
  >
    <motion.span
      className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Explorar
    </motion.span>
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className="text-muted-foreground/30"
    >
      <ArrowDown className="w-4 h-4" />
    </motion.div>
  </motion.div>
);

export default HeroScrollIndicator;
