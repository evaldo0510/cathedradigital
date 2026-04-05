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
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(20,14%,4%)]"
      >
        {/* Radial glow behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-[hsl(43,72%,53%)] opacity-[0.07] blur-[80px]" />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <SplashLogo className="w-24 h-24 sm:w-28 sm:h-28" />
          </motion.div>
        </motion.div>

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative z-10 mt-6 font-serif text-2xl sm:text-3xl font-bold tracking-wider"
          style={{ color: 'hsl(43, 72%, 53%)', fontFamily: 'Cinzel, serif' }}
        >
          CATHEDRA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative z-10 mt-2 text-xs tracking-[0.3em] uppercase"
          style={{ color: 'hsl(40, 20%, 80%)' }}
        >
          Fé &middot; Tradição &middot; Verdade
        </motion.p>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="relative z-10 mt-10 w-40 h-0.5 rounded-full overflow-hidden bg-white/10"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(43,72%,53%)] to-transparent"
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/** Redesigned logo — Chi-Rho monogram in gold circle */
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

      {/* Outer ring */}
      <circle cx="60" cy="60" r="57" stroke="url(#splash-gold)" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="60" r="53" stroke="url(#splash-gold)" strokeWidth="0.5" opacity="0.4" fill="none" />

      {/* Inner dark circle */}
      <circle cx="60" cy="60" r="50" fill="#1a1a1a" />

      {/* Chi-Rho (☧) monogram — P with X overlay */}
      {/* Vertical stroke of P (Rho) */}
      <line x1="60" y1="22" x2="60" y2="98" stroke="url(#splash-gold)" strokeWidth="3.5" strokeLinecap="round" />
      {/* P loop */}
      <path d="M60 22 C60 22, 82 24, 82 40 C82 54, 60 56, 60 56" stroke="url(#splash-gold)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* X arms (Chi) */}
      <line x1="38" y1="34" x2="82" y2="78" stroke="url(#splash-gold-light)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="82" y1="34" x2="38" y2="78" stroke="url(#splash-gold-light)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      {/* Alpha & Omega small marks */}
      <text x="30" y="98" fill="url(#splash-gold)" fontSize="11" fontFamily="Cinzel, serif" opacity="0.6">α</text>
      <text x="82" y="98" fill="url(#splash-gold)" fontSize="11" fontFamily="Cinzel, serif" opacity="0.6">ω</text>

      {/* Decorative dots at cardinal points */}
      <circle cx="60" cy="8" r="1.5" fill="#d4af37" opacity="0.5" />
      <circle cx="60" cy="112" r="1.5" fill="#d4af37" opacity="0.5" />
      <circle cx="8" cy="60" r="1.5" fill="#d4af37" opacity="0.5" />
      <circle cx="112" cy="60" r="1.5" fill="#d4af37" opacity="0.5" />
    </svg>
  </div>
);

export default SplashScreen;
