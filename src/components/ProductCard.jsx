import React from 'react';
import { Edit2, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const ProductCard = ({ product, onEdit, onDelete, isAdmin }) => {
  const isLowStock = product.stock < 10;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden group flex flex-col h-full">
      <div className="relative h-48 w-full bg-slate-100 flex items-center justify-center">
        {product.imageBase64 ? (
          <img 
            src={product.imageBase64} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Package className="h-16 w-16 text-slate-300" />
        )}
        
        {isLowStock && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-lg">
            Low Stock
          </div>
        )}

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-600">{product.category}</p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight flex-1">
            {product.name}
          </h3>
          <p className="font-black text-indigo-600">
            {formatCurrency(product.price)}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className={`h-2.5 w-2.5 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
          <p className={`text-xs font-bold ${isLowStock ? 'text-red-500' : 'text-slate-500'}`}>
            {product.stock} in stock
          </p>
        </div>

        {isAdmin && (
          <div className="mt-auto pt-4 border-t border-slate-50 flex gap-2">
            <button 
              onClick={() => onEdit(product)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all font-semibold text-sm active:scale-95"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all font-semibold text-sm active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
