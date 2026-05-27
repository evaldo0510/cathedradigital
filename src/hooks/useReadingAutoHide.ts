import React, { useState, useEffect } from 'react';

const useReadingAutoHide = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove('reading-scroll-down');
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

    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.classList.remove('reading-scroll-down');
    };
  }, []);
};

export default useReadingAutoHide;
