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
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const StaggeredList: React.FC<StaggeredListProps> = ({ children, className, staggerDelay = 0.08 }) => {
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
