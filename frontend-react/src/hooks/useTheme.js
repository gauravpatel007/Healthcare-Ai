import { useState, useCallback } from 'react';

/**
 * Fully isolated theme hook. Each call manages its own localStorage key.
 * Does NOT touch document.documentElement — the wrapper div handles dark class.
 */
const useTheme = (storageKey) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const setThemeValue = useCallback((value) => {
    setTheme(value);
    localStorage.setItem(storageKey, value);
  }, [storageKey]);

  return { theme, toggleTheme, setThemeValue };
};

export default useTheme;
