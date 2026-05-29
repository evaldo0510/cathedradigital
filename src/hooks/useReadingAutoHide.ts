import React, { useState, useEffect, useCallback } from 'react';

const useReadingAutoHide = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove('reading-scroll-down');
      document.documentElement.classList.remove('reveal-chrome');
      return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }

      if (scrollY > lastScrollY && scrollY > 100) {
        document.documentElement.classList.add('reading-scroll-down');
        // Hide chrome if revealed by tap when starting to scroll down again
        document.documentElement.classList.remove('reveal-chrome');
      } else {
        document.documentElement.classList.remove('reading-scroll-down');
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    const onTap = (e: MouseEvent | TouchEvent) => {
      // If UI is hidden, a tap should reveal it
      if (document.documentElement.classList.contains('reading-scroll-down')) {
        // Check if the click is on a link or button - if so, don't just toggle UI
        const target = e.target as HTMLElement;
        if (target.closest('button, a, [role="button"]')) return;

        document.documentElement.classList.toggle('reveal-chrome');
        
        // Vibrate for feedback if supported
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } else {
        document.documentElement.classList.remove('reveal-chrome');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onTap as any);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onTap as any);
      document.documentElement.classList.remove('reading-scroll-down');
      document.documentElement.classList.remove('reveal-chrome');
    };
  }, [enabled]);
};

export default useReadingAutoHide;
