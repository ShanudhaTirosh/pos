import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Banknote,
  CreditCard,
  Smartphone,
  UserCircle
} from 'lucide-react';
import { subscribeToOrders, updateOrder } from '../firebase/firestore';
import { syncOrderStatus } from '../firebase/realtimeDb';
import { formatCurrency } from '../utils/formatCurrency';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

const OrderStatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Refunded: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {status}
    </span>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // Update Firestore via utility
      await updateOrder(orderId, { status: newStatus });
      
      // Sync RTDB
      await syncOrderStatus(orderId, newStatus);
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.cashierId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Orders Management</h1>
        <p className="text-slate-500 font-medium mt-1">Track and manage service transactions.</p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Orders List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center opacity-30">
                <ClipboardList className="h-12 w-12 mb-4" />
                <p className="font-bold">No orders found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full p-6 text-left hover:bg-slate-50 transition-all flex items-center justify-between group ${selectedOrder?.id === order.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-white transition-colors">
                        <Clock className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">#{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {order.createdAt?.toDate().toLocaleString() || 'Just now'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-black text-slate-900">{formatCurrency(order.total)}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{order.items.length} items</p>
                      </div>
                      {order.paymentMethod && (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 ${
                          order.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-600' :
                          order.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-600' :
                          'bg-violet-50 text-violet-600'
                        }`}>
                          {order.paymentMethod === 'Cash' && <Banknote className="h-3 w-3" />}
                          {order.paymentMethod === 'Card' && <CreditCard className="h-3 w-3" />}
                          {order.paymentMethod === 'Mobile' && <Smartphone className="h-3 w-3" />}
                          {order.paymentMethod}
                        </span>
                      )}
                      <OrderStatusBadge status={order.status} />
                      <ChevronRight className={`h-5 w-5 text-slate-300 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90 text-indigo-500' : ''}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Details Panel */}
        <div className="w-96 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
          {selectedOrder ? (
            <>
              <div className="p-6 border-b border-slate-50">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Order Details</h3>
                <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">ID: {selectedOrder.id}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Items List */}
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax</span>
                    <span className="font-bold">{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg text-slate-900 font-black">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                {selectedOrder.paymentMethod && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Payment</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                      selectedOrder.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                      selectedOrder.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-700' :
                      'bg-violet-50 text-violet-700'
                    }`}>
                      {selectedOrder.paymentMethod === 'Cash' && <Banknote className="h-4 w-4" />}
                      {selectedOrder.paymentMethod === 'Card' && <CreditCard className="h-4 w-4" />}
                      {selectedOrder.paymentMethod === 'Mobile' && <Smartphone className="h-4 w-4" />}
                      {selectedOrder.paymentMethod}
                    </div>
                    {selectedOrder.paymentMethod === 'Cash' && selectedOrder.amountTendered && (
                      <div className="text-xs text-slate-500 space-y-1 mt-1">
                        <p>Tendered: {formatCurrency(selectedOrder.amountTendered)}</p>
                        <p>Change: {formatCurrency(selectedOrder.change || 0)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer */}
                {selectedOrder.customer && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-2">Customer</p>
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                      <UserCircle className="h-8 w-8 text-indigo-400" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedOrder.customer.name}</p>
                        <p className="text-xs text-slate-500">{selectedOrder.customer.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-tighter">Admin Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'Completed')}
                        disabled={selectedOrder.status === 'Completed'}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 rounded-2xl font-bold text-xs transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'Refunded')}
                        disabled={selectedOrder.status === 'Refunded'}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 rounded-2xl font-bold text-xs transition-all active:scale-95"
                      >
                        <XCircle className="h-4 w-4" />
                        Refund
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-300">
              <ClipboardList className="h-16 w-16 mb-4 opacity-10" />
              <p className="font-bold">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
