import React, { useState, useEffect } from 'react';
import { fetchCategories, addCompleteProduct } from '../../services/productService';
import type { Category } from '../../types';
import { Plus, Save, Loader2, CheckCircle, AlertCircle, ImagePlus, X } from 'lucide-react';

export const AddProduct: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  // 1. حالة المنتج الأساسي
  const [product, setProduct] = useState({ name: '', description: '', base_price: '', category_id: '' });
  
  // 2. 🚀 حالة الصورة (ملف الصورة والمعاينة بتاعتها)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // 3. حالة المقاسات والألوان
  const [variants, setVariants] = useState([{ size: '', color: '', stock_quantity: 0, sku: '' }]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(err => setMessage({ text: err.message, isError: true }));
  }, []);

  // دالة التعامل مع اختيار الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // عمل رابط وهمي للمعاينة
    }
  };

  // دالة إزالة الصورة
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const addVariantRow = () => {
    setVariants([...variants, { size: '', color: '', stock_quantity: 0, sku: '' }]);
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      if (!product.category_id) throw new Error("يجب اختيار القسم أولاً!");
      if (variants.length === 0 || !variants[0].size) throw new Error("يجب إضافة مقاس واحد على الأقل!");
      if (!imageFile) throw new Error("يجب إرفاق صورة للمنتج!"); // 🚀 تأكيد وجود الصورة

      // (في خطوة الداتا بيز: هنرفع الصورة الأول لـ Supabase Storage وناخد الرابط بتاعها نبعته مع البيانات)
      
      await addCompleteProduct(
        { ...product, base_price: Number(product.base_price) },
        variants.map(v => ({ ...v, stock_quantity: Number(v.stock_quantity) }))
      );

      setMessage({ text: 'تم إضافة المنتج للمخزن بنجاح!', isError: false });
      
      // تفريغ الحقول بعد النجاح
      setProduct({ name: '', description: '', base_price: '', category_id: product.category_id });
      setVariants([{ size: '', color: '', stock_quantity: 0, sku: '' }]);
      removeImage();
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#FBF9F6] border border-transparent focus:border-brand-sand focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-brand-sand/10 text-neo-text font-bold transition-all text-sm";
  const labelClass = "block text-gray-500 font-bold mb-2 text-xs";

  return (
    <div className="max-w-5xl mx-auto animate-fade-in font-['Tajawal',sans-serif]">
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-neo-text">إضافة منتج جديد</h2>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-2xl font-bold flex items-center gap-3 shadow-sm border ${message.isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
          {message.isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* القسم الأول: الصورة الأساسية للمنتج */}
        <div className="bg-white shadow-soft p-6 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center">
          <h3 className="text-lg font-black text-neo-text w-full border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-brand-sand rounded-full"></div>
            صورة المنتج
          </h3>
          
          <div className="relative w-full max-w-sm aspect-square bg-[#FBF9F6] rounded-[2rem] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-brand-sand transition-colors overflow-hidden group cursor-pointer">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover mix-blend-multiply" />
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeImage(); }}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                <ImagePlus size={48} className="text-gray-300 mb-4 group-hover:text-brand-sand transition-colors" />
                <span className="font-bold text-gray-500 text-sm">اضغط هنا لاختيار صورة</span>
              </>
            )}
          </div>
        </div>

        {/* القسم الثاني: بيانات المنتج الأساسية */}
        <div className="bg-white shadow-soft p-6 md:p-8 rounded-[2rem] border border-gray-100">
          <h3 className="text-lg font-black text-neo-text border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-brand-sand rounded-full"></div>
            المعلومات الأساسية
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>اسم المنتج</label>
              <input type="text" required value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className={inputClass} placeholder="مثال: تيشرت كاريزما صيفي" />
            </div>
            <div>
              <label className={labelClass}>القسم</label>
              <select required value={product.category_id} onChange={e => setProduct({...product, category_id: e.target.value})} className={inputClass}>
                <option value="">اختر القسم...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>السعر الأساسي (جنيه)</label>
              <input type="number" required min="0" value={product.base_price} onChange={e => setProduct({...product, base_price: e.target.value})} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>وصف المنتج</label>
              <input type="text" value={product.description} onChange={e => setProduct({...product, description: e.target.value})} className={inputClass} placeholder="خامة قطن 100%..." />
            </div>
          </div>
        </div>

        {/* القسم الثالث: المتغيرات (المقاسات والألوان) */}
        <div className="bg-white shadow-soft p-6 md:p-8 rounded-[2rem] border border-gray-100">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
            <h3 className="text-lg font-black text-neo-text flex items-center gap-2">
              <div className="w-2 h-6 bg-brand-sand rounded-full"></div>
              المقاسات والألوان المتوفرة
            </h3>
            <button type="button" onClick={addVariantRow} className="flex items-center gap-2 text-xs bg-[#FBF9F6] text-brand-brown border border-gray-200 px-4 py-2 rounded-xl font-bold hover:bg-brand-brown hover:text-white transition-colors shadow-sm">
              <Plus size={16} /> إضافة مقاس/لون آخر
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-[#FBF9F6] p-5 rounded-2xl border border-gray-100">
                <div>
                  <label className={labelClass}>المقاس</label>
                  <input type="text" required value={variant.size} onChange={e => updateVariant(index, 'size', e.target.value)} className={inputClass} placeholder="M, L, 42..." />
                </div>
                <div>
                  <label className={labelClass}>اللون</label>
                  <input type="text" required value={variant.color} onChange={e => updateVariant(index, 'color', e.target.value)} className={inputClass} placeholder="أسود، أحمر..." />
                </div>
                <div>
                  <label className={labelClass}>الكمية بالمخزن</label>
                  <input type="number" required min="0" value={variant.stock_quantity} onChange={e => updateVariant(index, 'stock_quantity', Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>كود الباركود (SKU)</label>
                  <input type="text" value={variant.sku} onChange={e => updateVariant(index, 'sku', e.target.value)} className={inputClass} placeholder="اختياري" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* زر الحفظ النهائي */}
        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-black text-lg text-white bg-brand-brown shadow-md hover:bg-opacity-90 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3">
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
          {loading ? 'جاري رفع المنتج لقاعدة البيانات...' : 'حفظ المنتج في المخزن'}
        </button>
        
      </form>
    </div>
  );
};