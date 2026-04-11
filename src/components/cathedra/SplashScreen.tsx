import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import cathedraLogo from '@/assets/cathedra-logo-new.png';

const SplashScreen = React.forwardRef<HTMLDivElement, { onComplete: () => void }>(({ onComplete }, ref) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'exit' ? 0 : 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(var(--primary))] overflow-hidden"
      >
        {/* Radial glow behind logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1.5 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Rotating light rays */}
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.08, rotate: 360 }}
          transition={{ opacity: { duration: 1 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
          className="absolute w-[600px] h-[600px]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, hsl(var(--secondary) / 0.15) 10%, transparent 20%, transparent 25%, hsl(var(--secondary) / 0.1) 35%, transparent 45%, transparent 50%, hsl(var(--secondary) / 0.12) 60%, transparent 70%, transparent 75%, hsl(var(--secondary) / 0.08) 85%, transparent 95%)`,
          }}
        />

        {/* Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, x: (i % 2 === 0 ? -1 : 1) * (20 + i * 8) }}
            animate={{ 
              opacity: [0, 0.6, 0], 
              y: [40, -60 - i * 10],
              x: (i % 2 === 0 ? -1 : 1) * (20 + i * 12),
            }}
            transition={{ duration: 2.5, delay: 0.3 + i * 0.12, ease: 'easeOut' }}
            className="absolute w-1 h-1 rounded-full bg-primary"
          />
        ))}

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-[3px] border-secondary/50 shadow-2xl">
            <img src={cathedraLogo} alt="Cathedra" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === 'text' || phase === 'logo' ? 1 : 0, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative z-10 mt-8 text-center"
        >
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, letterSpacing: '0.3em' }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-2xl md:text-3xl font-display font-bold text-secondary uppercase"
          >
            Cathedra
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-primary mt-2"
          >
            Digital Sanctuarium
          </motion.p>
        </motion.div>

        {/* Bottom loading bar */}
        <motion.div className="absolute bottom-12 w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;
