import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  AlertCircle,
  Calendar,
  ArrowUpRight,
  TrendingDown,
  Package,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { subscribeToOrders, subscribeToProducts, getUserCount } from '../firebase/firestore';
import { formatCurrency } from '../utils/formatCurrency';

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl ${color}`}>
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = subscribeToOrders(setOrders);
    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    
    const fetchUserCount = async () => {
      const count = await getUserCount();
      setUserCount(count);
    };
    fetchUserCount();

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  // Stats Logic
  const today = new Date().setHours(0, 0, 0, 0);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);

  const calculateSales = (since) => {
    return orders
      .filter(o => o.createdAt?.toDate().getTime() >= since && o.status === 'Completed')
      .reduce((sum, o) => sum + o.total, 0);
  };

  const totalSalesToday = calculateSales(today);
  const totalSalesWeek = calculateSales(weekAgo);
  const totalSalesMonth = calculateSales(monthAgo);

  const lowStockProducts = products.filter(p => p.stock < 10);

  // Top Products Logic
  const productSalesMap = {};
  orders.forEach(order => {
    if (order.status === 'Completed') {
      order.items.forEach(item => {
        productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
      });
    }
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
     return (
        <div className="h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time performance metrics and alerts.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <span className="font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Sales Today" 
          value={formatCurrency(totalSalesToday)} 
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />} 
          color="bg-emerald-50"
          trend={12.5}
        />
        <StatCard 
          title="Sales This Week" 
          value={formatCurrency(totalSalesWeek)} 
          icon={<ShoppingBag className="h-6 w-6 text-indigo-600" />} 
          color="bg-indigo-50"
        />
        <StatCard 
          title="Sales This Month" 
          value={formatCurrency(totalSalesMonth)} 
          icon={<Calendar className="h-6 w-6 text-violet-600" />} 
          color="bg-violet-50"
          trend={-2.4}
        />
        <StatCard 
          title="Active Staff" 
          value={userCount} 
          icon={<Users className="h-6 w-6 text-amber-600" />} 
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Top 5 Products */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Top Performing Products</h3>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          
          <div className="space-y-6">
            {topProducts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                    <Package className="h-12 w-12 mb-4 opacity-10" />
                    <p className="font-bold">No sales data yet</p>
                </div>
            ) : topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-sm font-black text-indigo-600">{p.count} sold</p>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(p.count / topProducts[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-2 mb-8">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h3 className="text-xl font-bold text-slate-900">Inventory Alerts</h3>
          </div>
          
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-100" />
                <p className="font-bold text-slate-400">All stock stable</p>
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100 group transition-all hover:bg-red-50 cursor-pointer">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-red-500 font-bold uppercase tracking-tighter">Only {p.stock} left</p>
                  </div>
                  <button className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-red-500 shadow-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
            
            {lowStockProducts.length > 6 && (
                <p className="text-center text-xs font-bold text-red-400 pt-2 cursor-pointer hover:underline">
                    + {lowStockProducts.length - 6} more alerts
                </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 overflow-hidden">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="pb-4">Order ID</th>
                <th className="pb-4">Date</th>
                <th className="pb-4">Total</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-bold text-slate-900 text-sm">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 text-slate-500 text-sm">{order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-4 font-black text-slate-900 text-sm">{formatCurrency(order.total)}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
