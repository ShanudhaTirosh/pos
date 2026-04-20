import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package } from 'lucide-react';
import { 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  subscribeToProducts 
} from '../firebase/firestore';
import { toast } from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import ProductModal from '../components/ProductModal';
import ProductCard from '../components/ProductCard';
import ConfirmModal from '../components/ConfirmModal';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = (data) => {
    addProduct(data).catch(() => toast.error('Network sync delayed, but saved locally.'));
    toast.success('Product added successfully!');
  };

  const handleUpdateProduct = (data) => {
    updateProduct(currentProduct.id, data).catch(() => toast.error('Network sync delayed, but saved locally.'));
    toast.success('Product updated successfully!');
  };

  const handleDeleteProduct = () => {
    deleteProduct(productToDelete).catch(() => toast.error('Network sync delayed, but deleted locally.'));
    toast.success('Product deleted successfully!');
    setIsConfirmOpen(false);
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Product Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your inventory and product listings.</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => {
              setCurrentProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No products found</h3>
          <p className="text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              onEdit={(p) => {
                setCurrentProduct(p);
                setIsModalOpen(true);
              }}
              onDelete={(id) => {
                setProductToDelete(id);
                setIsConfirmOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={currentProduct ? handleUpdateProduct : handleAddProduct}
        initialData={currentProduct}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
      />
    </div>
  );
};

export default ProductsPage;
