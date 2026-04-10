import { motion } from "framer-motion";

const PARTICLES = [0, 2, 4] as const;

const HeroParticles = () => (
  <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
    {PARTICLES.map((i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/30"
        style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
        animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
      />
    ))}
  </div>
);

export default HeroParticles;
