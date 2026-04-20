import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  Trash2, 
  CreditCard, 
  Package, 
  ShoppingCart,
  Receipt,
  ScanBarcode,
  Monitor,
  PauseCircle,
  PlayCircle,
  Keyboard,
  Plug,
  Unplug,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { subscribeToProducts, addOrder, decrementProductStock, getProductByBarcode, getGlobalSettings, updateCustomerLoyaltyPoints } from '../firebase/firestore';
import { syncOrderStatus } from '../firebase/realtimeDb';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useBarcodeReader from '../hooks/useBarcodeReader';
import { formatCurrency } from '../utils/formatCurrency';
import { generateReceiptHTML } from '../utils/receiptGenerator';
import { connectPrinter, disconnectPrinter, isPrinterConnected, printReceipt, isSerialSupported } from '../utils/thermalPrinter';
import CheckoutModal from '../components/CheckoutModal';
import ReceiptPreview from '../components/ReceiptPreview';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Feature modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);

  // Hold/Recall
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldCarts, setShowHeldCarts] = useState(false);

  // Shop settings for receipt
  const [shopSettings, setShopSettings] = useState({ shopName: 'SmartPOS', address: '', phone: '' });

  // Printer state
  const [printerConnected, setPrinterConnected] = useState(false);

  // Broadcast channel for customer display
  const broadcastRef = useRef(null);
  const searchInputRef = useRef(null);

  const { user, profile } = useAuth();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, setCart, subtotal, tax, total, taxRate } = useCart();

  // Initialize broadcast channel
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('smartpos-customer-display');
    return () => broadcastRef.current?.close();
  }, []);

  // Broadcast cart changes to customer display
  useEffect(() => {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'CART_UPDATE',
        payload: { cart }
      });
    }
  }, [cart]);

  // Load shop settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getGlobalSettings();
        setShopSettings(settings);
        if (broadcastRef.current) {
          broadcastRef.current.postMessage({
            type: 'SHOP_INFO',
            payload: { shopName: settings.shopName }
          });
        }
      } catch { /* defaults */ }
    };
    fetchSettings();
  }, []);

  // Subscribe to products
  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Barcode scan handler (used by USB barcode reader)
  const handleBarcodeScan = useCallback(async (barcode) => {
    try {
      const product = await getProductByBarcode(barcode);
      if (product) {
        if (product.stock <= 0) {
          toast.error(`${product.name} is out of stock`);
          return;
        }
        addToCart(product);
        toast.success(`Scanned: ${product.name}`, { icon: '📦' });
      } else {
        toast.error(`No product found for barcode: ${barcode}`);
      }
    } catch {
      toast.error('Error looking up barcode');
    }
  }, [addToCart]);

  // USB Barcode Reader — always listening for scanner input
  useBarcodeReader(handleBarcodeScan, { enabled: true });

  // Checkout handler (called from CheckoutModal)
  const handleCheckout = async ({ paymentMethod, amountTendered, change, customer }) => {
    try {
      const orderData = {
        items: cart,
        subtotal,
        tax,
        total,
        cashierId: user.uid,
        cashierName: profile?.name || user?.email?.split('@')[0],
        status: 'Completed',
        paymentMethod,
        amountTendered,
        change,
        customer: customer || null,
        createdAt: new Date()
      };

      const orderRef = await addOrder(orderData);
      // Fire realtime status update blindly so it doesn't halt execution if network pauses
      syncOrderStatus(orderRef.id, 'Completed').catch((err) => {
        console.warn('Realtime DB sync failed, order saved to Firestore anyway:', err);
      });

      // Update product stock asynchronously and atomically to not block the UI
      Promise.all(cart.map(item => 
        decrementProductStock(item.id, item.quantity)
      )).catch(console.error);

      // Add loyalty points if customer attached (1 point per 100 LKR) asynchronously
      if (customer?.id) {
        const pointsEarned = Math.floor(total / 100);
        if (pointsEarned > 0) {
          updateCustomerLoyaltyPoints(customer.id, pointsEarned).catch(console.error);
        }
      }

      // Broadcast sale complete
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({ type: 'SALE_COMPLETE' });
      }

      // Prepare receipt data
      const receiptData = {
        ...orderData,
        orderId: orderRef.id,
        shopName: shopSettings.shopName,
        address: shopSettings.address,
        phone: shopSettings.phone,
        taxRate: taxRate,
        date: new Date()
      };

      setLastOrderData(receiptData);

      // AUTO-PRINT: If thermal printer is connected, print directly
      if (isPrinterConnected()) {
        try {
          const html = generateReceiptHTML(receiptData);
          await printReceipt(receiptData, html);
          toast.success('Sale completed & receipt printed!', { icon: '🧾' });
        } catch (err) {
          toast.error('Sale saved but print failed: ' + err.message);
          setPrinterConnected(false);
        }
        clearCart();
        setIsCheckoutOpen(false);
        // Don't open receipt preview — it printed directly
      } else {
        toast.success('Sale completed successfully!');
        clearCart();
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true); // Show preview with print button
      }
    } catch (error) {
      toast.error('Checkout failed: ' + error.message);
      throw error;
    }
  };

  // Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty — nothing to hold');
      return;
    }
    setHeldCarts(prev => [...prev, {
      id: Date.now(),
      items: [...cart],
      subtotal,
      total,
      heldAt: new Date()
    }]);
    clearCart();
    toast.success('Order held! Start a new sale.', { icon: '⏸️' });
  };

  // Recall held cart
  const handleRecallCart = (heldCart) => {
    if (cart.length > 0) {
      // Hold current cart first
      setHeldCarts(prev => [...prev, {
        id: Date.now(),
        items: [...cart],
        subtotal,
        total,
        heldAt: new Date()
      }]);
    }
    // Set cart to recalled items
    if (typeof setCart === 'function') {
      setCart(heldCart.items);
    } else {
      clearCart();
      heldCart.items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart({ ...item, quantity: undefined });
        }
      });
    }
    setHeldCarts(prev => prev.filter(h => h.id !== heldCart.id));
    setShowHeldCarts(false);
    toast.success('Order recalled!', { icon: '▶️' });
  };

  // Delete held cart
  const handleDeleteHeld = (id) => {
    setHeldCarts(prev => prev.filter(h => h.id !== id));
    toast.success('Held order deleted');
  };

  // Launch customer display
  const handleLaunchCustomerDisplay = () => {
    const displayWindow = window.open('/customer-display', 'customerDisplay', 'width=1024,height=768');
    if (displayWindow) {
      toast.success('Customer display launched! Move it to the second screen.', { icon: '📺' });
      // Send initial data after window loads
      setTimeout(() => {
        if (broadcastRef.current) {
          broadcastRef.current.postMessage({
            type: 'SHOP_INFO',
            payload: { shopName: shopSettings.shopName }
          });
          broadcastRef.current.postMessage({
            type: 'CART_UPDATE',
            payload: { cart }
          });
        }
      }, 1000);
    }
  };

  // Connect/Disconnect thermal printer
  const handleTogglePrinter = async () => {
    if (printerConnected) {
      await disconnectPrinter();
      setPrinterConnected(false);
      toast.success('Printer disconnected');
    } else {
      try {
        await connectPrinter();
        setPrinterConnected(true);
        toast.success('Thermal printer connected! Receipts will print automatically.', { icon: '🖨️' });
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onHoldOrder: handleHoldCart,
    onRecallOrder: () => setShowHeldCarts(true),
    onCheckout: () => cart.length > 0 && setIsCheckoutOpen(true),
    onScanBarcode: () => {
      // Focus search input for manual barcode entry
      searchInputRef.current?.focus();
      toast('Scanner ready — scan or type barcode', { icon: '📡' });
    },
    onEscape: () => {
      setIsCheckoutOpen(false);
      setIsReceiptOpen(false);
      setShowHeldCarts(false);
    }
  });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Products Selection Section */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Top Bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products... (F2) — USB scanner auto-detects"
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Printer Connect/Disconnect */}
          {isSerialSupported() && (
            <button
              onClick={handleTogglePrinter}
              className={`flex items-center gap-2 px-5 py-3 font-bold rounded-2xl shadow-lg transition-all active:scale-95 whitespace-nowrap ${
                printerConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              title={printerConnected ? 'Disconnect Printer' : 'Connect Thermal Printer'}
            >
              {printerConnected ? <Unplug className="h-5 w-5" /> : <Plug className="h-5 w-5" />}
              <span className="hidden lg:inline">{printerConnected ? 'Printer ✓' : 'Printer'}</span>
            </button>
          )}

          <button
            onClick={handleLaunchCustomerDisplay}
            className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
            title="Open Customer Display"
          >
            <Monitor className="h-5 w-5" />
            <span className="hidden lg:inline">Display</span>
          </button>
        </div>

        {/* Scanner Status Indicator */}
        <div className="mb-3 flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <ScanBarcode className="h-3 w-3" />
            <span className="text-emerald-500">● USB Scanner Active</span>
          </div>
          <span>•</span>
          <Keyboard className="h-3 w-3" />
          <span>F2 Search</span>
          <span>•</span>
          <span>F4 Hold</span>
          <span>•</span>
          <span>F9 Checkout</span>
          {printerConnected && (
            <>
              <span>•</span>
              <span className="text-emerald-500">
                <Printer className="h-3 w-3 inline mr-1" />
                Auto-Print ON
              </span>
            </>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap active:scale-95 text-sm ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <Package className="h-16 w-16 mb-4" />
              <p className="font-bold">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product)}
                  className={`group relative flex flex-col text-left transition-all active:scale-95 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200 mb-2 group-hover:shadow-md transition-shadow">
                    {product.imageBase64 ? (
                      <img src={product.imageBase64} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{product.name}</h4>
                  <p className="text-indigo-600 font-black text-sm">{formatCurrency(product.price)}</p>
                  {product.barcode && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{product.barcode}</p>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Out of Stock</span>
                    </div>
                  )}
                  {product.stock > 0 && product.stock < 10 && (
                    <span className="text-[10px] text-red-500 font-bold">Only {product.stock} left</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">Current Cart</h2>
            {cart.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Held Orders Badge */}
            {heldCarts.length > 0 && (
              <button
                onClick={() => setShowHeldCarts(true)}
                className="relative flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-bold text-xs hover:bg-amber-100 transition-all"
                title="Recall Held Order (F5)"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {heldCarts.length}
              </button>
            )}
            <button 
              onClick={handleHoldCart}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all"
              title="Hold Order (F4)"
            >
              <PauseCircle className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={clearCart}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Receipt className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-bold">Cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Scan barcode or click to add items</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                <div className="h-14 w-14 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.imageBase64 && <img src={item.imageBase64} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                  <p className="text-indigo-600 font-black text-xs mb-1.5">{formatCurrency(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-indigo-600">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-indigo-600">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                         <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span className="font-bold">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 text-xl font-black pt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <CreditCard className="h-5 w-5" />
            Charge {formatCurrency(total)}
            <span className="text-xs opacity-70">(F9)</span>
          </button>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        taxRate={taxRate}
        total={total}
        onConfirm={handleCheckout}
      />

      {/* Receipt Preview (only shown when no direct printer) */}
      <ReceiptPreview
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        orderData={lastOrderData}
      />

      {/* Held Orders Modal */}
      {showHeldCarts && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-black text-slate-900">Held Orders</h2>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {heldCarts.length}
                </span>
              </div>
              <button
                onClick={() => setShowHeldCarts(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
              {heldCarts.length === 0 ? (
                <p className="text-center text-slate-400 py-8 font-medium">No held orders</p>
              ) : (
                heldCarts.map(held => (
                  <div key={held.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">
                          {held.items.length} items — {formatCurrency(held.total)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Held at {held.heldAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {held.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecallCart(held)}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Recall
                      </button>
                      <button
                        onClick={() => handleDeleteHeld(held.id)}
                        className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
