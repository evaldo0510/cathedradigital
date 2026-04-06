import { motion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.995, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, scale: 0.998, filter: 'blur(2px)' },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

const PageTransition = forwardRef<HTMLDivElement, { children: ReactNode }>(({ children }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      style={{ willChange: 'opacity, transform, filter' }}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
