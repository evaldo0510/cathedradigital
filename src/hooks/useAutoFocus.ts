import { useEffect } from 'react';

export const useAutoFocus = () => {
  useEffect(() => {
    const shouldFocus = sessionStorage.getItem('cathedra_auto_focus');
    if (shouldFocus) {
      sessionStorage.removeItem('cathedra_auto_focus');
      
      // Try to find the first H1 or first focusable content
      const firstHeading = document.querySelector('h1');
      if (firstHeading) {
        firstHeading.tabIndex = -1;
        firstHeading.focus();
        
        // Add a temporary highlight effect
        firstHeading.classList.add('auto-focused-title');
        setTimeout(() => {
          firstHeading.classList.remove('auto-focused-title');
        }, 2000);
      } else {
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.focus();
      }
    }
  }, []);
};
