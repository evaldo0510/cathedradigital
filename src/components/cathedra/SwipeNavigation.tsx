import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { AppRoute } from '../../types';

interface SwipeNavigationProps {
  children: React.ReactNode;
}

const SwipeNavigation: React.FC<SwipeNavigationProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Define the swipeable routes in order
  const routes = [
    '/', // Hoje
    AppRoute.BIBLE,
    AppRoute.CATECHISM,
  ];

  const currentIndex = routes.findIndex(route => 
    route === '/' 
      ? (currentPath === '/' || currentPath === '/home' || currentPath === '/hoje' || currentPath.startsWith('/hoje/'))
      : currentPath.startsWith(route)
  );


  const handleDragEnd = (_: any, info: PanInfo) => {
    // Only handle swipes on mobile (simple check)
    if (window.innerWidth >= 1024) return;

    const threshold = 150; // px - higher for even more intentionality
    const velocity = 0.3; // even lower velocity for a very calm feel

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swipe Left -> Next
      if (currentIndex !== -1 && currentIndex < routes.length - 1) {
        setTimeout(() => navigate(routes[currentIndex + 1]), 50); // Small micro-delay for fluidity
      }
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swipe Right -> Previous
      if (currentIndex !== -1 && currentIndex > 0) {
        setTimeout(() => navigate(routes[currentIndex - 1]), 50);
      }
    }
  };

  // If we are not on one of the swipeable routes, just return children
  if (currentIndex === -1) return <>{children}</>;

  return (
    <motion.div
      className="w-full min-h-screen will-change-transform swipe-navigation"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ touchAction: 'pan-y' }} // Allow vertical scroll, block horizontal for drag
    >
      {children}
    </motion.div>
  );
};

export default SwipeNavigation;
