import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface CatechismPendingContextValue {
  pending: number[];
  markPending: (paragraph: number) => void;
  clearPending: (paragraph: number) => void;
}

const CatechismPendingContext = createContext<CatechismPendingContextValue | null>(null);

export const CatechismPendingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingSet, setPendingSet] = useState<Set<number>>(() => new Set());

  const markPending = useCallback((paragraph: number) => {
    setPendingSet(prev => {
      if (prev.has(paragraph)) return prev;
      const next = new Set(prev);
      next.add(paragraph);
      return next;
    });
  }, []);

  const clearPending = useCallback((paragraph: number) => {
    setPendingSet(prev => {
      if (!prev.has(paragraph)) return prev;
      const next = new Set(prev);
      next.delete(paragraph);
      return next;
    });
  }, []);

  const pending = useMemo(() => Array.from(pendingSet).sort((a, b) => a - b), [pendingSet]);

  const value = useMemo(
    () => ({ pending, markPending, clearPending }),
    [pending, markPending, clearPending],
  );

  return (
    <CatechismPendingContext.Provider value={value}>
      {children}
    </CatechismPendingContext.Provider>
  );
};

export const useCatechismPending = () => {
  const ctx = useContext(CatechismPendingContext);
  // Safe no-op fallback so CatechismContent works outside the reading view too.
  if (!ctx) {
    return {
      pending: [] as number[],
      markPending: (_p: number) => {},
      clearPending: (_p: number) => {},
    };
  }
  return ctx;
};
