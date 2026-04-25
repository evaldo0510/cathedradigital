import React, { useCallback } from 'react';

/**
 * Hook to manage arrow navigation between focusable elements (tabs).
 * Supports horizontal (Left/Right) navigation.
 */
export function useTabNavigation() {
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent, 
    currentIndex: number, 
    totalCount: number, 
    onSelect: (index: number) => void,
    tabPrefixId: string = 'tab-'
  ) => {
    let nextIndex = -1;
    
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % totalCount;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + totalCount) % totalCount;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = totalCount - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextTab = document.getElementById(`${tabPrefixId}${nextIndex}`);
      if (nextTab) {
        nextTab.focus();
        // Option to auto-select tab on focus (common in some implementations)
        // onSelect(nextIndex); 
      }
    }
  }, []);

  return { handleKeyDown };
}

/**
 * Hook for roving tabindex in a generic list (e.g., tags, search results).
 * Manages which item is currently focusable.
 */
export function useRovingTabindex(totalCount: number) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, onSelect?: (index: number) => void) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % totalCount;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + totalCount) % totalCount;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = totalCount - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      setActiveIndex(nextIndex);
      
      // Focus the next element after state update
      setTimeout(() => {
        const elements = document.querySelectorAll('[data-roving-item]');
        (elements[nextIndex] as HTMLElement)?.focus();
      }, 0);
    }

    if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault();
      onSelect(index);
    }
  }, [totalCount]);

  return { activeIndex, setActiveIndex, handleKeyDown };
}

/**
 * Shared utility for tab attributes to ensure consistency.
 */
export const getTabProps = (
// ... keep existing code


export const getTabPanelProps = (
  id: string, 
  tabId: string, 
  isVisible: boolean, 
  className?: string
) => ({
  id,
  role: 'tabpanel',
  'aria-labelledby': tabId,
  tabIndex: isVisible ? 0 : -1,
  hidden: !isVisible,
  className
});
