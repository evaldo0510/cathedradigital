import { motion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

const pageVariants = {
  initial: { opacity: 0, scale: 0.99, filter: 'blur(8px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.01, filter: 'blur(8px)' },
};

const pageTransition = {
  duration: 1.2,
  ease: [0.25, 0.1, 0.25, 1], // More contemplative, slower ease
};

const fastTransition = {
  duration: 0.1,
  ease: 'linear',
};

const PageTransition = forwardRef<HTMLDivElement, { children: ReactNode }>(({ children }, ref) => {
  const { settings } = useReadingSettings();
  
  return (
    <motion.div
      ref={ref}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={settings.reduceAnimations ? fastTransition : pageTransition}
      className="w-full relative"
    >
      {/* Micro-rhythm: Discrete highlight on entry */}
      {!settings.reduceAnimations && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.5, times: [0, 0.2, 1], ease: "easeInOut" }}
          className="fixed inset-0 pointer-events-none z-[200] bg-primary/[0.01]"
        />
      )}
      {children}
    </motion.div>
  );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
