import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Package, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Customer-Facing Display Page
 * Designed to be opened in a second browser window on a customer-facing monitor.
 * Receives real-time cart updates via BroadcastChannel API.
 */
const CustomerDisplayPage = () => {
  const [cart, setCart] = useState([]);
  const [shopName, setShopName] = useState('SmartPOS');
  const [lastAddedId, setLastAddedId] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const prevCartRef = useRef([]);

  useEffect(() => {
    const channel = new BroadcastChannel('smartpos-customer-display');

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'CART_UPDATE') {
        const newCart = payload.cart || [];
        // Detect newly added items
        const prevIds = new Set(prevCartRef.current.map(i => i.id));
        const newItems = newCart.filter(i => !prevIds.has(i.id));
        if (newItems.length > 0) {
          setLastAddedId(newItems[newItems.length - 1].id);
          setTimeout(() => setLastAddedId(null), 1500);
        }
        prevCartRef.current = newCart;
        setCart(newCart);
      }
      if (type === 'SHOP_INFO') {
        setShopName(payload.shopName || 'SmartPOS');
      }
      if (type === 'SALE_COMPLETE') {
        // Flash a "Thank You" message
        setCart([]);
        prevCartRef.current = [];
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 5000);
      }
    };

    return () => channel.close();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white flex flex-col overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/30">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{shopName}</h1>
            <p className="text-sm text-slate-400 font-medium">Welcome! Your order details below.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white/90">{timeStr}</p>
          <p className="text-xs text-slate-400 font-medium">{dateStr}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {showThankYou ? (
          /* Thank You Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-12 animate-fade-in">
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Check className="h-20 w-20 text-white" />
              </div>
            </div>
            <h2 className="text-5xl font-black mb-4 text-emerald-400">
              Thank You!
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-md">
              Your transaction is complete. Have a great day!
            </p>
          </div>
        ) : cart.length === 0 ? (
          /* Idle / Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 animate-pulse">
                <ShoppingCart className="h-20 w-20 text-white/80" />
              </div>
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Welcome!
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-md">
              Your order items will appear here as they are added.
            </p>
          </div>
        ) : (
          /* Cart Display */
          <div className="flex-1 flex flex-col">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-10 py-6 space-y-3">
              {/* Table Header */}
              <div className="flex items-center gap-4 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500">
                <span className="flex-1">Item</span>
                <span className="w-20 text-center">Qty</span>
                <span className="w-28 text-center">Price</span>
                <span className="w-32 text-right">Total</span>
              </div>
              
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-500 ${
                    lastAddedId === item.id
                      ? 'bg-indigo-600/30 border border-indigo-500/40 scale-[1.02]'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="h-14 w-14 bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                    {item.imageBase64 ? (
                      <img src={item.imageBase64} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-white truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400">{item.category}</p>
                  </div>
                  <div className="w-20 text-center">
                    <span className="bg-white/10 px-4 py-2 rounded-lg font-black text-lg">{item.quantity}</span>
                  </div>
                  <div className="w-28 text-center text-slate-300 font-bold">
                    {formatCurrency(item.price)}
                  </div>
                  <div className="w-32 text-right font-black text-lg text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Bar */}
            <div className="px-10 py-8 bg-gradient-to-r from-indigo-600 to-violet-600 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-1">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                  </p>
                  <p className="text-xs text-white/50">Subtotal (before tax)</p>
                </div>
                <div className="text-right">
                  <p className="text-6xl font-black text-white tracking-tight">
                    {formatCurrency(subtotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-10 py-3 bg-black/30 text-center">
        <p className="text-xs text-slate-500 font-medium">
          Powered by {shopName} • SmartPOS System
        </p>
      </div>
    </div>
  );
};

export default CustomerDisplayPage;
