import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
              type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            }`}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
