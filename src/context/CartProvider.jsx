import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { syncCart, subscribeToCartSync } from '../firebase/realtimeDb';
import { getGlobalSettings } from '../firebase/firestore';
import { CartContext } from './CartContext';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [taxRate, setTaxRate] = useState(0.08); // Default 8%
  const { user } = useAuth();

  // Load global settings (tax rate) once user is logged in
  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const settings = await getGlobalSettings();
        if (settings && typeof settings.taxRate === 'number') {
          setTaxRate(settings.taxRate / 100);
        }
      } catch {
        console.error("CartProvider: Error fetching tax settings");
      }
    };
    fetchSettings();
  }, [user]);

  // Load cart from Realtime DB once user is logged in
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToCartSync(user.uid, (syncedCart) => {
        if (syncedCart) {
          setCart(prev => {
            if (JSON.stringify(prev) === JSON.stringify(syncedCart)) {
              return prev; // Bail out if identical to prevent infinite loop
            }
            return syncedCart;
          });
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Handle cart clearing on logout asynchronously to avoid cascading renders
  useEffect(() => {
    if (!user && cart.length > 0) {
      // Defer to avoid synchronous setState warning
      queueMicrotask(() => setCart([]));
    }
  }, [user, cart.length]);

  // Sync cart to Realtime DB whenever it changes
  useEffect(() => {
    if (user && cart.length >= 0) {
      const syncPromise = syncCart(user.uid, cart);
      if (syncPromise) syncPromise.catch(() => {}); // Suppress RTDB network errors
    }
  }, [cart, user]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          if (delta > 0 && newQuantity > item.stock) return item; 
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const value = {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    total,
    taxRate
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
