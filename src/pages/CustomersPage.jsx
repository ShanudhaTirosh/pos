import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  X,
  Save,
  UserCircle
} from 'lucide-react';
import { subscribeToCustomers, addCustomer, updateCustomer, deleteCustomer } from '../firebase/firestore';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    loyaltyPoints: 0
  });

  useEffect(() => {
    const unsubscribe = subscribeToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setCurrentCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', loyaltyPoints: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      loyaltyPoints: customer.loyaltyPoints || 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }
    try {
      if (currentCustomer) {
        await updateCustomer(currentCustomer.id, formData);
        toast.success('Customer updated');
      } else {
        await addCustomer(formData);
        toast.success('Customer added');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Error saving customer');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(customerToDelete);
      toast.success('Customer deleted');
    } catch {
      toast.error('Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Customers</h1>
            <p className="text-slate-500 font-medium mt-1">
              {customers.length} registered {customers.length === 1 ? 'customer' : 'customers'}
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Users className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No customers found</h3>
          <p className="text-slate-500">Add your first customer or adjust your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCircle className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{customer.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {customer.loyaltyPoints || 0} points
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-500">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="font-medium truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="font-medium truncate">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-50 flex">
                <button
                  onClick={() => handleOpenEdit(customer)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-semibold text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <div className="w-px bg-slate-100"></div>
                <button
                  onClick={() => {
                    setCustomerToDelete(customer.id);
                    setIsConfirmOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all font-semibold text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {currentCustomer ? 'Edit Customer' : 'New Customer'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="Customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="+94 77 123 4567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all h-20 resize-none"
                  placeholder="Customer address"
                />
              </div>
              {currentCustomer && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Loyalty Points</label>
                  <input
                    type="number"
                    value={formData.loyaltyPoints}
                    onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {currentCustomer ? 'Update' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete Customer"
      />
    </div>
  );
};

export default CustomersPage;
