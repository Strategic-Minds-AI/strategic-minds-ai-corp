import { useState, useCallback } from 'react';

// Persists a piece of UI state across navigation so leaving a screen
// and coming back doesn't reset it. sessionStorage survives within the
// tab session but clears when the tab closes.
export default function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
    } catch { /* ignore */ }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  const update = useCallback((next) => {
    setValue(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try { sessionStorage.setItem(key, JSON.stringify(resolved)); } catch { /* ignore */ }
      return resolved;
    });
  }, [key]);

  return [value, update];
}