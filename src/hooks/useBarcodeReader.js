import { useEffect, useRef, useCallback } from 'react';

/**
 * useBarcodeReader Hook
 * 
 * Listens for USB/Bluetooth barcode scanner input globally.
 * Barcode scanners act as HID keyboard devices — they rapidly type characters
 * (typically < 50ms between keypresses) and finish with an Enter key.
 * 
 * This hook differentiates scanner input from normal typing by:
 * 1. Detecting rapid sequential keypresses (< 50ms apart)
 * 2. Requiring a minimum barcode length (default 4 chars)
 * 3. Only triggering on Enter key to submit
 * 
 * @param {Function} onScan - Callback with the scanned barcode string
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the hook is active (default: true)
 * @param {number} options.minLength - Minimum barcode length (default: 4)
 * @param {number} options.maxDelay - Max ms between keypresses to count as scanner input (default: 50)
 */
const useBarcodeReader = (onScan, options = {}) => {
  const {
    enabled = true,
    minLength = 4,
    maxDelay = 50
  } = options;

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timerRef = useRef(null);
  const onScanRef = useRef(onScan);

  // Keep callback ref updated without re-registering the listener
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    lastKeyTimeRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Allow the search input to work normally for manual typing
      // Scanner input is differentiated by speed (< 50ms between chars)
      
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        
        if (barcode.length >= minLength) {
          // This looks like a barcode scan - prevent default to avoid form submission
          e.preventDefault();
          e.stopPropagation();
          onScanRef.current(barcode);
        }
        
        resetBuffer();
        return;
      }

      // Only accumulate printable single characters
      if (e.key.length !== 1) {
        // Non-printable key (Shift, Ctrl, etc.) - ignore but don't reset
        return;
      }

      // If too much time passed since last keypress, reset (this is manual typing)
      if (timeDiff > maxDelay && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      bufferRef.current += e.key;
      lastKeyTimeRef.current = now;

      // Auto-clear buffer after 200ms of no input (safety net)
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        resetBuffer();
      }, 200);
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      clearTimeout(timerRef.current);
    };
  }, [enabled, minLength, maxDelay, resetBuffer]);
};

export default useBarcodeReader;
