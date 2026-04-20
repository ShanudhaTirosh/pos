import React, { useRef, useState } from 'react';
import { X, Printer, Check } from 'lucide-react';
import { generateReceiptHTML } from '../utils/receiptGenerator';
import { isPrinterConnected, printReceipt } from '../utils/thermalPrinter';
import { toast } from 'react-hot-toast';

const ReceiptPreview = ({ isOpen, onClose, orderData }) => {
  const iframeRef = useRef(null);
  const [printing, setPrinting] = useState(false);

  if (!isOpen || !orderData) return null;

  const receiptHTML = generateReceiptHTML(orderData);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const method = await printReceipt(orderData, receiptHTML);
      if (method === 'direct') {
        toast.success('Receipt printed directly!', { icon: '🧾' });
      }
      // For iframe fallback, the browser print dialog handles it
    } catch (error) {
      toast.error('Print failed: ' + error.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">Receipt Preview</h2>
            {isPrinterConnected() && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <Check className="h-3 w-3" />
                Thermal printer connected — direct print
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Receipt Display */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div
            className="bg-white mx-auto shadow-lg rounded-lg p-0 overflow-hidden"
            style={{ maxWidth: '320px' }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: receiptHTML }}
              className="receipt-preview-content"
              style={{ fontSize: '11px' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex-1 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {printing ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Printer className="h-5 w-5" />
                {isPrinterConnected() ? 'Print Direct' : 'Print Receipt'}
              </>
            )}
          </button>
        </div>

        {/* Hidden iframe for fallback printing */}
        <iframe
          ref={iframeRef}
          style={{ display: 'none', position: 'absolute', width: 0, height: 0 }}
          title="receipt-print"
        />
      </div>
    </div>
  );
};

export default ReceiptPreview;
