import React from 'react';
import { motion } from 'framer-motion';

interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  duration?: number;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15, scale: 0.985, filter: 'blur(4px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { 
      duration: 1.2, 
      ease: [0.16, 1, 0.3, 1] as const
    } 
  },
};

const StaggeredList: React.FC<StaggeredListProps> = ({ children, className, staggerDelay = 0.12 }) => {
  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export { StaggeredList, item as staggerItemVariants };
export default StaggeredList;
