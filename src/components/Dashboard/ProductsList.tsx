import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Package, Search, Loader2, Plus } from 'lucide-react';
import { fetchProducts } from '../../services/productService';
import { Link } from 'react-router-dom';
import type { ProductWithVariants } from '../../types';

export const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // 🚀 جلب المنتجات من قاعدة البيانات
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (err: any) {
        setError('حصل مشكلة في تحميل المنتجات.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // 🚀 فلترة آمنة جداً
  const filteredProducts = products.filter(product => {
    if (!product || !product.name) return false; 
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in font-['Tajawal',sans-serif]">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-brown text-white flex items-center justify-center shadow-md shrink-0">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neo-text">مخزن المنتجات</h1>
            <p className="text-gray-500 text-sm mt-1 font-bold">إدارة مخزونك، تعديل الأسعار، ومتابعة الكميات</p>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 outline-none focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-neo-text transition-all shadow-sm"
            />
          </div>
          <Link to="/add-product" className="hidden sm:flex items-center justify-center gap-2 bg-brand-brown text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all shrink-0">
            <Plus size={18} /> إضافة منتج
          </Link>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-center border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="text-brand-brown animate-spin" />
          <p className="text-gray-500 font-bold">جاري تحميل المخزن...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-gray-100 border-dashed shadow-sm">
              <div className="w-20 h-20 bg-[#FBF9F6] rounded-full flex items-center justify-center text-gray-300">
                <Package size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-neo-text mb-2">المخزن فارغ حالياً!</h3>
              </div>
              <Link to="/add-product" className="mt-4 bg-[#FBF9F6] text-brand-brown border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-brand-brown hover:text-white transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={18} /> أضف منتجك الأول
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};