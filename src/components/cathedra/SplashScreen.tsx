import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  visible: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(20,14%,4%)]"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-[hsl(43,72%,53%)] opacity-[0.07] blur-[80px]" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <SplashLogo className="w-20 h-20 sm:w-24 sm:h-24" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="relative z-10 mt-5 font-serif text-2xl font-bold tracking-wider"
          style={{ color: 'hsl(43, 72%, 53%)', fontFamily: 'Cinzel, serif' }}
        >
          CATHEDRA
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className="relative z-10 mt-8 w-32 h-0.5 rounded-full overflow-hidden bg-white/10"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(43,72%,53%)] to-transparent"
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SplashLogo: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
  <div className={className}>
    <img 
      src="/icon-512.png" 
      alt="Cathedra Logo" 
      className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]"
    />
  </div>
);

export default SplashScreen;
