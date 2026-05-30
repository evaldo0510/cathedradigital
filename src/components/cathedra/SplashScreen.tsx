import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';

const SplashScreen = React.forwardRef<HTMLDivElement, { onComplete: () => void }>(({ onComplete }, ref) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 200);
    const t2 = setTimeout(() => setPhase('exit'), 600);
    const t3 = setTimeout(onComplete, 800);
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
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden transition-colors duration-1000"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1.5 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute w-[500px] h-[500px] rounded-premium-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.4) 0%, transparent 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.08, rotate: 360 }}
          transition={{ opacity: { duration: 1 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
          className="absolute w-[600px] h-[600px]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, hsl(var(--secondary) / 0.15) 10%, transparent 20%, transparent 25%, hsl(var(--secondary) / 0.1) 35%, transparent 45%, transparent 50%, hsl(var(--secondary) / 0.12) 60%, transparent 70%, transparent 75%, hsl(var(--secondary) / 0.08) 85%, transparent 95%)`,
          }}
        />

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, x: (i % 2 === 0 ? -1 : 1) * (20 + i * 8) }}
            animate={{ 
              opacity: [0, 0.4, 0], 
              y: [40, -60 - i * 10],
              x: (i % 2 === 0 ? -1 : 1) * (20 + i * 12),
            }}
            transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
            className="absolute w-spacing-2xs h-spacing-2xs rounded-premium-full bg-primary"
          />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <div className="w-spacing-4xl h-spacing-4xl md:w-spacing-4xl md:h-spacing-4xl rounded-premium overflow-hidden border-[1px] border-primary/5 shadow-premium-hover bg-background/50 backdrop-blur-md">
            <Icons.Logo className="w-full h-full p-spacing-md opacity-40" variant="dark" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === 'text' || phase === 'logo' ? 1 : 0, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative z-10 mt-spacing-xl text-center"
        >
          <motion.h2
            initial={{ opacity: 0, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, letterSpacing: '0.3em' }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-premium-2xl md:text-premium-3xl font-display font-light text-primary uppercase tracking-[0.4em]"
          >
            Cathedra
          </motion.h2>
          <motion.p aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-primary/30 mt-spacing-sm"
          >
            Digital Sanctuarium
          </motion.p>
        </motion.div>

        <motion.div className="absolute bottom-spacing-2xl w-spacing-4xl h-spacing-3xs bg-card/50 rounded-premium overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-primary/10 rounded-premium-full"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;