import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of `value` that only updates after `delay` ms
 * have passed without the value changing. Useful for search inputs to
 * avoid firing one network request per keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
