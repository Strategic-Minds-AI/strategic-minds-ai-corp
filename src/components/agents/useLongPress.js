import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, { duration = 500 } = {}) {
  const timer = useRef(null);
  const longPressed = useRef(false);

  const start = useCallback((e) => {
    longPressed.current = false;
    // Prevent context menu on long press
    if (e.preventDefault) e.preventDefault();
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onLongPress(e);
    }, duration);
  }, [onLongPress, duration]);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const isLongPress = useCallback(() => longPressed.current, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onContextMenu: (e) => { e.preventDefault(); onLongPress(e); },
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    isLongPress,
  };
}