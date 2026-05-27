import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cathedra_offline_mode';

export function useOfflineMode() {
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOfflineMode));
    } catch {}
    
    // Dispatch a global event so other components can react
    window.dispatchEvent(new CustomEvent('offline-mode-change', { detail: isOfflineMode }));
  }, [isOfflineMode]);

  const toggle = useCallback(() => {
    setIsOfflineMode(prev => !prev);
  }, []);

  return { isOfflineMode, toggle };
}
