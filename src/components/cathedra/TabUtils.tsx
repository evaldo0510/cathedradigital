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
 * Shared utility for tab attributes to ensure consistency.
 */
export const getTabProps = (
  id: string, 
  panelId: string, 
  isSelected: boolean, 
  className?: string
) => ({
  id,
  role: 'tab',
  'aria-selected': isSelected,
  'aria-controls': panelId,
  tabIndex: isSelected ? 0 : -1,
  className
});

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
