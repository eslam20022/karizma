import React, { useState } from 'react';
import type { ProductWithVariants } from '../../types';
import { Edit, Trash2, Layers, Package, X, Save, AlertCircle } from 'lucide-react';
// 🚀 استدعاء دوال الحذف والتعديل من الداتا بيز
import { deleteProduct, updateProductVariants } from '../../services/productService'; 

interface ProductCardProps {
  product: ProductWithVariants;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); 
  
  const [editableVariants, setEditableVariants] = useState(product.variants || []);

  const totalStock = editableVariants.reduce((sum, variant) => sum + variant.stock_quantity, 0);
  const isAvailable = totalStock > 0;

  // 🗑️ لوجيك الحذف الحقيقي
  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteProduct(product.id); // بيمسح من Supabase
      setIsDeleted(true); // بيخفي الكارت من الشاشة
    } catch (error) {
      alert("حصل مشكلة أثناء الحذف، حاول مرة تانية!");
    } finally {
      setIsSaving(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // 💾 لوجيك التعديل الحقيقي
  const handleSaveStock = async () => {
    setIsSaving(true);
    try {
      await updateProductVariants(editableVariants); // بيحدث الكميات في Supabase
      setIsEditOpen(false); // بيقفل المودال
    } catch (error) {
      alert("حصل مشكلة أثناء تحديث المخزون!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStockChange = (index: number, newQuantity: number) => {
    const updated = [...editableVariants];
    updated[index].stock_quantity = newQuantity < 0 ? 0 : newQuantity; 
    setEditableVariants(updated);
  };

  if (isDeleted) return null;

  return (
    <>
      <div className="bg-white rounded-[2rem] p-3 md:p-4 shadow-soft border border-gray-100 flex flex-col group transition-transform duration-300 hover:-translate-y-1 font-['Tajawal',sans-serif]">
        
        <div className="relative aspect-square bg-[#FBF9F6] rounded-[1.5rem] overflow-hidden mb-4 flex items-center justify-center p-2">
          <img 
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500&auto=format&fit=crop" 
            alt={product.name}
            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          />
          
          <span className={`absolute top-3 right-3 text-[10px] font-bold px-3 py-1.5 rounded-full z-10 shadow-sm border ${
            isAvailable ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {isAvailable ? 'متوفر' : 'نفذت الكمية'}
          </span>
        </div>

        <div className="flex flex-col flex-grow px-1">
          <h3 className="text-sm md:text-base font-bold text-neo-text mb-1 truncate" title={product.name}>
            {product.name}
          </h3>
          <p className="text-lg font-black text-brand-brown mb-4">
            {product.base_price} <span className="text-[10px]">ج.م</span>
          </p>

          <div className="flex justify-between items-center bg-[#FBF9F6] p-3 rounded-xl mb-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
              <Layers size={14} className="text-brand-sand" />
              <span>{editableVariants.length} فئات</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
              <Package size={14} className="text-brand-sand" />
              <span className={!isAvailable ? 'text-red-500' : ''}>{totalStock} قطعة</span>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-4 gap-2">
            <button onClick={() => setIsEditOpen(true)} className="col-span-3 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-[#F5F5F5] text-gray-700 hover:bg-brand-brown hover:text-white transition-all shadow-sm border border-transparent hover:border-brand-brown">
              <Edit size={14} /> تعديل المخزون
            </button>
            
            <button onClick={() => setIsDeleteConfirmOpen(true)} className="col-span-1 flex items-center justify-center py-2.5 rounded-xl font-bold text-xs bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="حذف المنتج">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Tajawal',sans-serif]">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-premium animate-fade-in border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-neo-text">تعديل المخزون</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm font-bold text-brand-brown mb-4 truncate">{product.name}</p>

            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-6">
              {editableVariants.map((variant, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#FBF9F6] p-3 rounded-xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">المقاس: {variant.size}</span>
                    <span className="text-xs font-bold text-gray-500">اللون: {variant.color}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] text-brand-sand font-bold">الكمية</label>
                    <input 
                      type="number" 
                      value={variant.stock_quantity}
                      onChange={(e) => handleStockChange(idx, parseInt(e.target.value) || 0)}
                      className="w-16 text-center bg-white border border-gray-200 rounded-lg py-1 text-sm font-bold outline-none focus:border-brand-brown"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSaveStock} disabled={isSaving} className="w-full bg-brand-brown text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50">
              {isSaving ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التعديلات</>}
            </button>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Tajawal',sans-serif]">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-premium animate-fade-in border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-neo-text mb-2">هل أنت متأكد؟</h3>
            <p className="text-gray-500 text-sm font-bold mb-6">سيتم حذف هذا المنتج بجميع مقاساته وألوانه من المخزن نهائياً.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">
                إلغاء
              </button>
              <button onClick={handleDelete} disabled={isSaving} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-colors disabled:opacity-50">
                {isSaving ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};