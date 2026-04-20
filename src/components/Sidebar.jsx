import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  LogOut,
  User,
  Settings,
  UserCircle,
  Users,
  ShieldCheck
} from 'lucide-react';
import { logout } from '../firebase/auth';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

const Sidebar = () => {
  const { user, role, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Error logging out');
    }
  };

  const navItems = [
    { to: "/", icon: <ShoppingCart />, label: "POS", roles: ["admin", "cashier"] },
    { to: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard", roles: ["admin"] },
    { to: "/products", icon: <Package />, label: "Products", roles: ["admin"] },
    { to: "/orders", icon: <ClipboardList />, label: "Orders", roles: ["admin", "cashier"] },
    { to: "/customers", icon: <Users />, label: "Customers", roles: ["admin"] },
    { to: "/staff", icon: <ShieldCheck />, label: "Staff", roles: ["admin"] },
    { to: "/profile", icon: <UserCircle />, label: "Profile", roles: ["admin", "cashier"] },
    { to: "/settings", icon: <Settings />, label: "Settings", roles: ["admin"] },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SmartPOS</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          if (!item.roles.includes(role)) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <span className="font-semibold">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-3 px-4">
          <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <User className="h-6 w-6 text-slate-300" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">{profile?.name || user?.email?.split('@')[0]}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all duration-200 group font-semibold"
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
