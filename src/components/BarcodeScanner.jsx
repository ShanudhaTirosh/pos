import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Keyboard, Zap } from 'lucide-react';
import Quagga from '@ericblade/quagga2';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [cameraError, setCameraError] = useState(false);
  const hasScannedRef = useRef(false);

  const handleDetected = useCallback((result) => {
    if (hasScannedRef.current) return;
    const code = result.codeResult?.code;
    if (code) {
      hasScannedRef.current = true;
      onScan(code);
      onClose();
    }
  }, [onScan, onClose]);

  useEffect(() => {
    if (!isOpen || mode !== 'camera') return;

    hasScannedRef.current = false;

    const timer = setTimeout(() => {
      if (!scannerRef.current) return;
      setCameraError(false);

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_128_reader",
            "code_39_reader"
          ]
        },
        locate: true,
        frequency: 10,
      }, (err) => {
        if (err) {
          console.error("Quagga init error:", err);
          setCameraError(true);
          setMode('manual');
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected(handleDetected);
    }, 100);

    return () => {
      clearTimeout(timer);
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, [isOpen, mode, handleDetected]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Barcode Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              mode === 'camera'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            Camera
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              mode === 'manual'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Keyboard className="h-4 w-4" />
            Manual Entry
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'camera' ? (
            <div className="space-y-4">
              {cameraError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                  <Camera className="h-10 w-10 text-red-300 mx-auto mb-3" />
                  <p className="font-bold text-red-600 mb-1">Camera unavailable</p>
                  <p className="text-sm text-red-500">Please use manual entry instead</p>
                </div>
              ) : (
                <>
                  <div
                    ref={scannerRef}
                    className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden"
                  >
                    {/* Scanner laser line overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-3/4 h-0.5 bg-red-500 opacity-70 animate-pulse shadow-lg shadow-red-500/50"></div>
                    </div>
                    {/* Corner markers */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg pointer-events-none z-10"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg pointer-events-none z-10"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg pointer-events-none z-10"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg pointer-events-none z-10"></div>
                  </div>
                  <p className="text-center text-sm text-slate-400 font-medium">
                    Point camera at barcode to scan automatically
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Enter Barcode Number</label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. 8901234567890"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none font-mono text-lg tracking-widest text-center"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-black rounded-2xl shadow-xl shadow-violet-600/20 transition-all active:scale-95"
              >
                Look Up Product
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
