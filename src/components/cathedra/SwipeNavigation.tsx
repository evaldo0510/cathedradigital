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


  const handleDragEnd = (event: any, info: PanInfo) => {
    // Only handle swipes on mobile (simple check)
    if (window.innerWidth >= 1024) return;

    // Check if the interaction was actually a deliberate swipe and not a stray touch
    // Increased ratio and threshold to prevent accidental navigation to CIC
    const isHorizontalSwipe = Math.abs(info.offset.x) > Math.abs(info.offset.y) * 3;
    if (!isHorizontalSwipe) return;

    const threshold = 120; // Increased from 80 to 120px to be more deliberate
    const velocity = 0.5; // Increased from 0.3 to 0.5


    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swipe Left -> Next
      if (currentIndex !== -1 && currentIndex < routes.length - 1) {
        // Log to telemetry if available or just proceed
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
      className="w-full min-h-screen will-change-transform swipe-navigation pointer-events-auto"
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
