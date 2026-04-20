import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  UserCircle,
  Search,
  UserPlus,
  Check,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { getCustomerByPhone, addCustomer } from '../firebase/firestore';
import { toast } from 'react-hot-toast';

const CheckoutModal = ({ isOpen, onClose, cart, subtotal, tax, taxRate, total, onConfirm }) => {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const tenderedRef = useRef(null);
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setPaymentMethod('Cash');
        setAmountTendered('');
        setCustomer(null);
        setCustomerSearch('');
        setShowNewCustomer(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setProcessing(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && paymentMethod === 'Cash' && tenderedRef.current) {
      setTimeout(() => tenderedRef.current?.focus(), 100);
    }
  }, [isOpen, paymentMethod]);

  const change = paymentMethod === 'Cash' ? Math.max(0, parseFloat(amountTendered || 0) - total) : 0;
  const canComplete = paymentMethod !== 'Cash' || parseFloat(amountTendered || 0) >= total;

  const handleSearchCustomer = async () => {
    if (!customerSearch.trim()) return;
    setIsSearching(true);
    try {
      const found = await getCustomerByPhone(customerSearch.trim());
      if (found) {
        setCustomer(found);
        toast.success(`Customer found: ${found.name}`);
      } else {
        toast('No customer found with that phone number', { icon: '🔍' });
      }
    } catch {
      toast.error('Error searching customer');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      const docRef = await addCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: '',
        address: ''
      });
      setCustomer({
        id: docRef.id,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim()
      });
      setShowNewCustomer(false);
      toast.success('Customer added!');
    } catch {
      toast.error('Error adding customer');
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await onConfirm({
        paymentMethod,
        amountTendered: paymentMethod === 'Cash' ? parseFloat(amountTendered || 0) : total,
        change,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
      });
    } catch {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const paymentMethods = [
    { key: 'Cash', icon: Banknote, color: 'emerald' },
    { key: 'Card', icon: CreditCard, color: 'blue' },
    { key: 'Mobile', icon: Smartphone, color: 'violet' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">Complete Sale</h2>
            <p className="text-sm text-slate-500 font-medium">{cart.length} items</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Grand Total */}
          <div className="bg-slate-900 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
            <p className="text-4xl font-black text-white">{formatCurrency(total)}</p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-slate-400">
              <span>Subtotal: {formatCurrency(subtotal)}</span>
              <span>Tax ({(taxRate * 100).toFixed(1)}%): {formatCurrency(tax)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.key}
                    onClick={() => setPaymentMethod(method.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-bold text-sm transition-all active:scale-95 border-2 ${
                      paymentMethod === method.key
                        ? `bg-${method.color}-50 border-${method.color}-500 text-${method.color}-700 shadow-lg`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                    style={paymentMethod === method.key ? {
                      backgroundColor: method.color === 'emerald' ? '#ecfdf5' : method.color === 'blue' ? '#eff6ff' : '#f5f3ff',
                      borderColor: method.color === 'emerald' ? '#10b981' : method.color === 'blue' ? '#3b82f6' : '#8b5cf6',
                      color: method.color === 'emerald' ? '#047857' : method.color === 'blue' ? '#1d4ed8' : '#6d28d9'
                    } : {}}
                  >
                    <IconComponent className="h-6 w-6" />
                    {method.key}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash-specific: Amount tendered */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Amount Tendered</p>
              <input
                ref={tenderedRef}
                type="number"
                step="0.01"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0.00"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-black text-2xl text-center"
              />
              {parseFloat(amountTendered || 0) > 0 && (
                <div className={`p-4 rounded-2xl text-center font-black text-lg ${
                  change >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  Change: {formatCurrency(change)}
                </div>
              )}

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setAmountTendered(String(amount))}
                    className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 transition-all active:scale-95"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Customer (Optional)</p>
            
            {customer ? (
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                <UserCircle className="h-10 w-10 text-indigo-400" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="text-xs text-red-500 font-bold hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                      placeholder="Search by phone..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 transition-all outline-none text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSearchCustomer}
                    disabled={isSearching}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95 text-sm disabled:opacity-50"
                  >
                    {isSearching ? '...' : 'Find'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewCustomer(!showNewCustomer)}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add New Customer
                  </button>
                </div>

                {showNewCustomer && (
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 transition-all outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 transition-all outline-none text-sm"
                    />
                    <button
                      onClick={handleAddNewCustomer}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95"
                    >
                      Save Customer
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer - Confirm */}
        <div className="p-6 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={!canComplete || processing}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {processing ? (
              <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="h-6 w-6" />
                Complete Sale — {formatCurrency(total)}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          {paymentMethod === 'Cash' && !canComplete && (
            <p className="text-center text-xs text-red-500 font-bold mt-2">
              Amount tendered must be at least {formatCurrency(total)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
