import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Archive, Lock, X, Save, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { Product } from '../../types';

// 🛑 الباسورد السري لتعديل أو حذف المخزون
const ADMIN_INVENTORY_PASSWORD = "eslam2244"; 

export const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // حالة فتح وإغلاق الموديلات (لعرض المتغيرات)
  const [expandedModels, setExpandedModels] = useState<string[]>([]);

  // --- حالات الحماية (الباسورد) ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete', product: Product | null } | null>(null);

  // --- حالات تعديل المخزون والتفاصيل للقطعة ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newMainStock, setNewMainStock] = useState<number | string>('');
  const [newRemainingStock, setNewRemainingStock] = useState<number | string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("خطأ في جلب المخزون", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelName: string) => {
    setExpandedModels(prev => 
      prev.includes(modelName) ? prev.filter(name => name !== modelName) : [...prev, modelName]
    );
  };

  // 🚀 تجميع المنتجات بناءً على الاسم (Group By Name)
  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: { name: string, category: string, price: number, totalStock: number, variants: Product[] } } = {};
    
    products.forEach(p => {
      if (!groups[p.name]) {
        groups[p.name] = {
          name: p.name,
          category: p.category || 'عام',
          price: p.price,
          totalStock: 0,
          variants: []
        };
      }
      groups[p.name].variants.push(p);
      groups[p.name].totalStock += (p.stock_int || 0);
    });

    // فلترة التجميعات بناءً على البحث
    const search = searchTerm.toLowerCase();
    return Object.values(groups).filter(group => {
      // يطابق اسم الموديل
      if (group.name.toLowerCase().includes(search)) return true;
      // أو يطابق أي باركود، لون، أو مقاس جوا الموديل
      return group.variants.some(v => 
        (v.barcode && v.barcode.includes(search)) ||
        (v.color && v.color.toLowerCase().includes(search)) ||
        (v.size && v.size.toLowerCase().includes(search))
      );
    });
  }, [products, searchTerm]);

  const requireAuth = (type: 'edit' | 'delete', product: Product) => {
    if (type === 'delete') {
      setPendingAction({ type, product });
      setShowAuthModal(true);
    } else {
      if (isAuthorized) {
        executeAction(type, product);
      } else {
        setPendingAction({ type, product });
        setShowAuthModal(true);
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_INVENTORY_PASSWORD) {
      if (pendingAction?.type !== 'delete') setIsAuthorized(true);
      
      setShowAuthModal(false);
      setPasswordInput('');
      
      if (pendingAction?.product) executeAction(pendingAction.type, pendingAction.product);
    } else {
      alert("كلمة المرور غير صحيحة!");
      setPasswordInput('');
    }
  };

  const executeAction = (type: 'edit' | 'delete', product: Product) => {
    if (type === 'edit') {
      setSelectedProduct(product);
      setNewMainStock(product.main_stock !== undefined ? product.main_stock : product.stock_int);
      setNewRemainingStock(product.stock_int);
      setShowEditModal(true);
    } else if (type === 'delete') {
      handleDelete(product.id);
    }
    setPendingAction(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      window.dispatchEvent(new Event('stockUpdated')); 
    } catch (error) {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleSaveStock = async () => {
    if (!selectedProduct) return;
    const mainVal = Number(newMainStock);
    const remainingVal = Number(newRemainingStock);
    
    if (isNaN(mainVal) || mainVal < 0 || isNaN(remainingVal) || remainingVal < 0) {
      return alert("رجاء إدخال كميات صحيحة!");
    }

    setUpdating(true);
    try {
      await productService.updateProduct(selectedProduct.id, { 
        main_stock: mainVal, 
        stock_int: remainingVal,
      });
      
      setProducts(products.map(p => p.id === selectedProduct.id ? 
        { ...p, main_stock: mainVal, stock_int: remainingVal } : p
      ));
      
      setShowEditModal(false);
      alert("تم تحديث كمية القطعة بنجاح!");
      window.dispatchEvent(new Event('stockUpdated'));  
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={40} className="text-brand-brown animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-['Tajawal',sans-serif] pb-10">
      
      {/* ========================================== */}
      {/* 🔒 شاشة تأكيد الباسورد */}
      {/* ========================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-fade-in relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 flex items-center justify-center rounded-2xl ${pendingAction?.type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-brand-sand/20 text-brand-brown'}`}>
                {pendingAction?.type === 'delete' ? <Trash2 size={32} /> : <Lock size={32} />}
              </div>
            </div>
            <h2 className="text-2xl font-black text-center mb-2">
              {pendingAction?.type === 'delete' ? 'حذف صنف نهائياً' : 'صلاحية الإدارة'}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6 font-bold">
              {pendingAction?.type === 'delete' 
                ? `أدخل كلمة المرور لتأكيد حذف المتغير (كود: ${pendingAction.product?.barcode})` 
                : 'أدخل كلمة المرور لتعديل كمية القطعة'}
            </p>
            <form onSubmit={handleAuthSubmit}>
              <input 
                type="password" autoFocus required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="كلمة المرور..."
                className={`w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-4 mb-4 outline-none text-center text-xl tracking-[0.5em] font-bold transition-all ${pendingAction?.type === 'delete' ? 'focus:border-red-500' : 'focus:border-brand-brown'}`}
              />
              <button type="submit" className={`w-full text-white font-black py-4 rounded-xl transition ${pendingAction?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-brown hover:bg-[#603813]'}`}>
                {pendingAction?.type === 'delete' ? 'تأكيد الحذف' : 'تأكيد الصلاحية'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ✏️ شاشة تعديل المخزون للمتغير الواحد */}
      {/* ========================================== */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-fade-in relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            <h2 className="text-xl font-black mb-1 border-b pb-4">تعديل كمية القطعة</h2>
            
            <div className="bg-gray-50 p-3 rounded-xl mt-4 mb-6 border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-gray-800 font-black">{selectedProduct.name}</p>
                <p className="text-sm font-bold text-gray-500 mt-1">مقاس: {selectedProduct.size} | لون: {selectedProduct.color}</p>
              </div>
              <div className="bg-brand-brown text-white px-3 py-1 rounded-lg font-mono text-sm shadow-sm">
                {selectedProduct.barcode}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">الكمية الرئيسية (إجمالي المشتريات):</label>
                <input 
                  type="number" required value={newMainStock} onChange={(e) => setNewMainStock(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-gray-400 text-center text-xl font-black text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-brown mb-2">الكمية المتبقية (المتاح للبيع الآن):</label>
                <input 
                  type="number" required value={newRemainingStock} onChange={(e) => setNewRemainingStock(e.target.value)}
                  className="w-full bg-white border-2 border-brand-brown/30 rounded-xl px-4 py-3 outline-none focus:border-brand-brown text-center text-xl font-black text-brand-brown"
                />
              </div>
            </div>
            
            <button onClick={handleSaveStock} disabled={updating} className="w-full bg-brand-brown text-white font-black py-4 rounded-xl hover:bg-[#603813] transition flex items-center justify-center gap-2 shadow-md">
              {updating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 💻 واجهة الجرد الرئيسية */}
      {/* ========================================== */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-brown text-white flex items-center justify-center shadow-md shrink-0">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neo-text">إدارة المخزون</h1>
            <p className="text-gray-500 text-sm mt-1 font-bold">إجمالي الموديلات: {groupedProducts.length} | إجمالي القطع: {products.length}</p>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث باسم الموديل، اللون، المقاس، الكود..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 outline-none focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-neo-text transition-all shadow-sm"
            />
          </div>
          <Link to="/add-product" className="hidden sm:flex items-center justify-center gap-2 bg-brand-brown text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#603813] transition-all shrink-0">
            <Plus size={18} /> إضافة موديل جديد
          </Link>
        </div>
      </header>

      {/* ========================================== */}
      {/* 📦 قائمة الموديلات والمتغيرات */}
      {/* ========================================== */}
      <div className="bg-white p-2 md:p-6 rounded-[2rem] shadow-soft border border-gray-100">
        
        <div className="hidden md:grid grid-cols-5 text-gray-400 font-bold px-6 pb-4 border-b border-gray-100 text-right text-sm">
          <div className="col-span-2">اسم الموديل</div>
          <div>القسم</div>
          <div>سعر البيع</div>
          <div className="text-center">إجمالي القطع</div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {groupedProducts.map((group) => {
            const isExpanded = expandedModels.includes(group.name);

            return (
              <div key={group.name} className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-white hover:border-brand-brown/30">
                {/* 🔽 سطر الموديل الرئيسي (قابل للضغط) */}
                <div 
                  onClick={() => toggleModel(group.name)}
                  className="grid grid-cols-1 md:grid-cols-5 items-center p-4 cursor-pointer hover:bg-[#FBF9F6] transition-colors gap-4 md:gap-0"
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-brand-brown hover:bg-brand-brown hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div>
                      <h3 className="font-black text-neo-text text-lg">{group.name}</h3>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md mt-1 inline-block md:hidden">{group.category}</span>
                    </div>
                  </div>
                  <div className="hidden md:block font-bold text-brand-sand">{group.category}</div>
                  <div className="font-black text-green-600 hidden md:block">{group.price} ج.م</div>
                  <div className="text-right md:text-center flex justify-between items-center md:block">
                    <span className="md:hidden font-bold text-gray-400">الإجمالي:</span>
                    <span className={`font-black px-3 py-1 rounded-lg ${group.totalStock <= 5 ? 'bg-red-50 text-red-600' : 'bg-brand-sand/10 text-brand-brown'}`}>
                      {group.totalStock} قطعة
                    </span>
                  </div>
                </div>

                {/* 📋 جدول المتغيرات (يظهر عند الضغط) */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-200 p-4 md:p-6 animate-fade-in">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <thead className="bg-[#FBF9F6]">
                          <tr className="text-gray-500 border-b border-gray-100 text-sm">
                            <th className="py-3 px-4 font-black">الكود (SKU)</th>
                            <th className="py-3 px-4 font-black text-center">المقاس</th>
                            <th className="py-3 px-4 font-black text-center">اللون</th>
                            <th className="py-3 px-4 font-black text-center">الكمية (أساسي / متبقي)</th>
                            <th className="py-3 px-4 font-black text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.variants.map(variant => (
                            <tr key={variant.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-brand-brown">{variant.barcode}</td>
                              <td className="py-3 px-4 text-center font-bold text-gray-700">{variant.size || '-'}</td>
                              <td className="py-3 px-4 text-center font-bold text-gray-700">{variant.color || '-'}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-2 bg-[#FBF9F6] px-3 py-1 rounded-lg border border-gray-200">
                                  <span className="text-gray-400 font-bold text-sm" title="الكمية الرئيسية">{variant.main_stock !== undefined ? variant.main_stock : variant.stock_int}</span>
                                  <span className="text-gray-300">/</span>
                                  <span className={`font-black text-sm ${variant.stock_int <= 3 ? 'text-red-600' : 'text-brand-brown'}`} title="الكمية المتبقية">{variant.stock_int}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 flex justify-center gap-2">
                                <button onClick={() => requireAuth('edit', variant)} className="p-2 text-blue-500 hover:bg-blue-50 hover:shadow-sm rounded-lg transition" title="تعديل الكمية">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => requireAuth('delete', variant)} className="p-2 text-red-500 hover:bg-red-50 hover:shadow-sm rounded-lg transition" title="حذف القطعة">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {groupedProducts.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-gray-100 border-dashed">
              <div className="w-20 h-20 bg-[#FBF9F6] rounded-full flex items-center justify-center text-gray-300">
                <Package size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-neo-text mb-2">لا توجد منتجات مطابقة!</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};