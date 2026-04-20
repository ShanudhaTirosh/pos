import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Users, 
  Search, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Firebase imports for creating secondary app
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig, db } from '../firebase/config';
import { subscribeToUsers, deleteUserDoc } from '../firebase/firestore';
import ConfirmModal from '../components/ConfirmModal';
import useAuth from '../hooks/useAuth';

const StaffPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Track creation state
  const [isCreating, setIsCreating] = useState(false);

  const { user: currentUser } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const unsubscribe = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (data) => {
    setIsCreating(true);
    let secondaryApp;
    try {
      // 1. Initialize secondary app so primary admin session doesn't log out
      secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the user
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      
      // 3. Immediately log out secondary app so no session sticks around
      await signOut(secondaryAuth);

      // 4. Save the user to Firestore `users` collection manually using primary DB
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: serverTimestamp()
      });

      toast.success(`${data.name} added as ${data.role}!`);
      setIsModalOpen(false);
      reset({ name: '', email: '', password: '', role: 'cashier' });

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
         toast.error('Email is already registered!');
      } else if (error.code === 'auth/weak-password') {
         toast.error('Password should be at least 6 characters.');
      } else {
         toast.error(error.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (userToDelete.id === currentUser.uid) {
        toast.error("You cannot delete your own account.");
        setIsConfirmOpen(false);
        return;
    }

    try {
      // Note: This only deletes the Firestore profile in client mode.
      // Firebase prevents clients from deleting Auth records of other users.
      // In a pure client app, this "revokes" access by removing their profile.
      await deleteUserDoc(userToDelete.id);
      toast.success('Staff access revoked from database');
    } catch {
      toast.error('Error removing staff access');
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage admin and cashier accounts.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          Add Staff
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-xs font-black uppercase text-slate-400 tracking-widest">
              <th className="p-6">Name / Email</th>
              <th className="p-6">Role</th>
              <th className="p-6">Created</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-12 text-center">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-bold text-slate-500">No users found.</p>
                </td>
              </tr>
            ) : filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6">
                  <p className="font-bold text-slate-900">{u.name || 'Unnamed'}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="p-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${
                    u.role === 'admin' 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    {u.role === 'admin' ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {u.role}
                  </span>
                </td>
                <td className="p-6 text-sm text-slate-500 font-medium">
                  {u.createdAt?.toDate().toLocaleDateString() || '--'}
                </td>
                <td className="p-6 text-right">
                  <button
                    onClick={() => {
                      setUserToDelete(u);
                      setIsConfirmOpen(true);
                    }}
                    disabled={u.id === currentUser.uid}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    title={u.id === currentUser.uid ? "Cannot delete yourself" : "Revoke Access"}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Staff Account</h2>
              <button disabled={isCreating} onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAddStaff)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="Ex: John Doe"
                  disabled={isCreating}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="cashier@shop.com"
                  disabled={isCreating}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="••••••••"
                  disabled={isCreating}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-bold"
                  disabled={isCreating}
                  defaultValue="cashier"
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                  {isCreating ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteStaff}
        title="Revoke Staff Access"
        message={`Are you sure you want to revoke database access for ${userToDelete?.email}? They will no longer be able to log in to the POS system.`}
        confirmText="Revoke Access"
      />
    </div>
  );
};

export default StaffPage;
