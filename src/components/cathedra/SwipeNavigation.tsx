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
    AppRoute.MAGISTERIUM,
    AppRoute.LITURGIA,
    AppRoute.BIBLIOTECA,
  ];

  const currentIndex = routes.findIndex(route => 
    route === '/' 
      ? (currentPath === '/' || currentPath === '/home' || currentPath === '/hoje' || currentPath.startsWith('/hoje/'))
      : currentPath.startsWith(route)
  );


  const handleDragEnd = (_: any, info: PanInfo) => {
    // Only handle swipes on mobile (simple check)
    if (window.innerWidth >= 1024) return;

    const threshold = 100; // px
    const velocity = 0.5;

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swipe Left -> Next
      if (currentIndex !== -1 && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swipe Right -> Previous
      if (currentIndex !== -1 && currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
        window.scrollTo({ top: 0, behavior: 'instant' });
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
