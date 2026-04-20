import React, { useState, useEffect } from 'react';
import { subscribeToAuthChanges } from '../firebase/auth';
import { getUserProfile, createUserProfile } from '../firebase/firestore';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);
          if (!userProfile) {
            userProfile = {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
              role: 'admin', // Bootstrapping: default to admin for now
            };
            userProfile = await createUserProfile(firebaseUser.uid, userProfile);
          }
          setUser(firebaseUser);
          setProfile(userProfile);
        } catch (error) {
          console.error("AuthProvider: Profile fetch error", error);
          // Still set the user so they aren't stuck on login
          // Use a fallback profile with admin role so they can access the app
          setUser(firebaseUser);
          setProfile({
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email,
            role: 'admin'
          });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    role: profile?.role,
    isAdmin: profile?.role === 'admin',
    isCashier: profile?.role === 'cashier',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
