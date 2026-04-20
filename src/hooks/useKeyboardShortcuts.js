import { useEffect } from 'react';

/**
 * POS Keyboard Shortcuts Hook
 * 
 * Shortcuts:
 *   F2  — Focus search / barcode input
 *   F4  — Hold current order
 *   F5  — Recall held orders
 *   F9  — Open checkout
 *   F12 — Open barcode scanner
 *   Escape — Close any open modal
 */
const useKeyboardShortcuts = (handlers = {}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs (except function keys)
      const isFunctionKey = e.key.startsWith('F') && !isNaN(e.key.slice(1));
      const isEscape = e.key === 'Escape';

      if (!isFunctionKey && !isEscape) return;

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          handlers.onFocusSearch?.();
          break;
        case 'F4':
          e.preventDefault();
          handlers.onHoldOrder?.();
          break;
        case 'F5':
          e.preventDefault();
          handlers.onRecallOrder?.();
          break;
        case 'F9':
          e.preventDefault();
          handlers.onCheckout?.();
          break;
        case 'F12':
          e.preventDefault();
          handlers.onScanBarcode?.();
          break;
        case 'Escape':
          handlers.onEscape?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};

export default useKeyboardShortcuts;
