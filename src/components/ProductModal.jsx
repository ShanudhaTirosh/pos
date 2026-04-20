import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { fileToBase64 } from '../utils/base64Converter';
import { toast } from 'react-hot-toast';

const ProductModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [imageBase64, setImageBase64] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
        // Defer to avoid synchronous setState warning
        queueMicrotask(() => setImageBase64(initialData.imageBase64 || ''));
      } else {
        reset({
          name: '',
          price: '',
          category: '',
          stock: '',
          barcode: ''
        });
        queueMicrotask(() => setImageBase64(''));
      }
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const base64 = await fileToBase64(file);
        setImageBase64(base64);
      } catch {
        toast.error('Failed to process image');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onFormSubmit = (data) => {
    if (!imageBase64 && !initialData?.imageBase64) {
      toast.error('Please upload an image');
      return;
    }
    onSubmit({ ...data, price: parseFloat(data.price), stock: parseInt(data.stock), barcode: data.barcode || '', imageBase64 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transition-all scale-100 opacity-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Product Image</p>
            <div className={`relative h-40 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${imageBase64 ? 'border-indigo-500' : 'border-slate-300 hover:border-indigo-400'}`}>
              {imageBase64 ? (
                <>
                  <img src={imageBase64} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                  <button 
                    type="button" 
                    onClick={() => setImageBase64('')}
                    className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur rounded-full shadow-md text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  ) : (
                    <>
                      <div className="bg-indigo-50 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-indigo-600" />
                      </div>
                      <span className="text-sm text-slate-500 font-medium text-center px-4">
                        Click or drag to upload image
                      </span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                placeholder="Ex: Cheeseburger"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { required: 'Price is required', min: 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="0.00"
                />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Stock</label>
                <input
                  type="number"
                  {...register('stock', { required: 'Stock is required', min: 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                  placeholder="0"
                />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <input
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
                placeholder="Ex: Main Course"
              />
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Barcode <span className="text-slate-400 text-xs font-normal">(optional)</span></label>
              <input
                {...register('barcode')}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-mono tracking-wider"
                placeholder="e.g. 8901234567890"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {initialData ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
