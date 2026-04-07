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
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="splash-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c547" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="splash-gold-light" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0d56c" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" stroke="url(#splash-gold)" strokeWidth="2.5" fill="none" />
      <circle cx="60" cy="60" r="52" fill="#1a1a1a" />
      <line x1="60" y1="25" x2="60" y2="95" stroke="url(#splash-gold)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M60 25 C60 25, 82 27, 82 42 C82 54, 60 56, 60 56" stroke="url(#splash-gold)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <line x1="40" y1="42" x2="80" y2="82" stroke="url(#splash-gold-light)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="80" y1="42" x2="40" y2="82" stroke="url(#splash-gold-light)" strokeWidth="3.5" strokeLinecap="round" />
      <text x="32" y="94" fill="url(#splash-gold)" fontSize="12" fontFamily="Cinzel, serif" fontWeight="bold">α</text>
      <text x="78" y="94" fill="url(#splash-gold)" fontSize="12" fontFamily="Cinzel, serif" fontWeight="bold">ω</text>
    </svg>
  </div>
);

export default SplashScreen;
