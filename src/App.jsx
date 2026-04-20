import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import useAuth from './hooks/useAuth';

// Pages
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import CustomersPage from './pages/CustomersPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import StaffPage from './pages/StaffPage';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Customer display has no sidebar
  const isCustomerDisplay = location.pathname === '/customer-display';
  
  if (isCustomerDisplay) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex bg-slate-50 min-h-screen">
      {user && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${user ? 'ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <AppLayout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Customer Display - No auth, standalone */}
            <Route path="/customer-display" element={<CustomerDisplayPage />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <POSPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <ProductsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/customers" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <CustomersPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/staff" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <StaffPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
