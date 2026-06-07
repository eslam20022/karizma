import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Archive, Lock, X, Save, ChevronDown, ChevronUp, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
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

  // --- حالة التنبيهات الشيك الجديدة (Custom Alert) ---
  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'password';
    title: string;
    message: string;
    passwordTarget?: 'edit' | 'delete';
    targetProduct?: Product | null;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const [inputPassword, setInputPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // --- حالات تعديل المخزون والتفاصيل للقطعة ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newMainStock, setNewMainStock] = useState<number | string>('');
  const [newRemainingStock, setNewRemainingStock] = useState<number | string>('');
  // 🔥 حالة جديدة لتعديل السعر
  const [newPrice, setNewPrice] = useState<number | string>('');
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

    const search = searchTerm.toLowerCase();
    return Object.values(groups).filter(group => {
      if (group.name.toLowerCase().includes(search)) return true;
      return group.variants.some(v =>
        (v.barcode && v.barcode.includes(search)) ||
        (v.color && v.color.toLowerCase().includes(search)) ||
        (v.size && v.size.toLowerCase().includes(search))
      );
    });
  }, [products, searchTerm]);

  // ==========================================
  // 🔒 طلب كلمة السر والتحقق
  // ==========================================
  const requireAuth = (type: 'edit' | 'delete', product: Product) => {
    if (type === 'delete') {
      setCustomAlert({
        isOpen: true,
        type: 'password',
        title: 'حذف صنف نهائياً',
        message: `أدخل كلمة المرور لتأكيد حذف المتغير\n(كود: ${product.barcode})`,
        passwordTarget: type,
        targetProduct: product
      });
    } else {
      if (isAuthorized) {
        openEditModal(product);
      } else {
        setCustomAlert({
          isOpen: true,
          type: 'password',
          title: 'صلاحية الإدارة',
          message: 'أدخل كلمة المرور لتعديل بيانات القطعة',
          passwordTarget: type,
          targetProduct: product
        });
      }
    }
  };

  const handleVerifyPassword = () => {
    if (inputPassword !== ADMIN_INVENTORY_PASSWORD) {
      setCustomAlert({
        isOpen: true, type: 'error', title: 'خطأ في التحقق', message: 'كلمة المرور غير صحيحة!'
      });
      setInputPassword('');
      return;
    }

    const target = customAlert.passwordTarget;
    const product = customAlert.targetProduct;

    if (target !== 'delete') setIsAuthorized(true);

    setInputPassword('');
    setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' });

    if (product) {
      if (target === 'delete') {
        setTimeout(() => {
          setCustomAlert({
            isOpen: true,
            type: 'confirm',
            title: 'تأكيد الحذف النهائي',
            message: `⚠️ تحذير: هل أنت متأكد من حذف هذا المتغير نهائياً؟\nالكود: ${product.barcode}`,
            onConfirm: () => executeDelete(product.id)
          });
        }, 100);
      } else if (target === 'edit') {
        openEditModal(product);
      }
    }
  };

  // ==========================================
  // 🚀 تنفيذ الأكشنز (تعديل - حذف)
  // ==========================================
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setNewMainStock(product.main_stock !== undefined ? product.main_stock : product.stock_int);
    setNewRemainingStock(product.stock_int);
    // 🔥 تحميل السعر الحالي للقطعة
    setNewPrice(product.price || 0);
    setShowEditModal(true);
  };

  const executeDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      window.dispatchEvent(new Event('stockUpdated'));
      
      setCustomAlert({
        isOpen: true, type: 'success', title: 'تم الحذف', message: 'تم حذف الصنف من المخزون بنجاح.'
      });
    } catch (error: any) {
      setCustomAlert({
        isOpen: true, type: 'error', title: 'فشل الحذف', message: error.message || 'حدث خطأ أثناء الحذف'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStock = async () => {
    if (!selectedProduct) return;
    const mainVal = Number(newMainStock);
    const remainingVal = Number(newRemainingStock);
    const priceVal = Number(newPrice); // 🔥 تحويل السعر الجديد لرقم

    if (isNaN(mainVal) || mainVal < 0 || isNaN(remainingVal) || remainingVal < 0 || isNaN(priceVal) || priceVal < 0) {
      setCustomAlert({ isOpen: true, type: 'error', title: 'خطأ', message: 'رجاء إدخال أرقام صحيحة للكميات والسعر!' });
      return;
    }

    setUpdating(true);
    try {
      // 🔥 تحديث الكميات والسعر في الداتا بيز
      await productService.updateProduct(selectedProduct.id, {
        main_stock: mainVal,
        stock_int: remainingVal,
        price: priceVal, 
      });

      // 🔥 تحديث السعر والكميات في الشاشة
      setProducts(products.map(p => p.id === selectedProduct.id ?
        { ...p, main_stock: mainVal, stock_int: remainingVal, price: priceVal } : p
      ));

      setShowEditModal(false);
      window.dispatchEvent(new Event('stockUpdated'));
      
      setCustomAlert({
        isOpen: true, type: 'success', title: 'تم التحديث', message: 'تم تحديث بيانات القطعة بنجاح!'
      });
    } catch (error: any) {
      setCustomAlert({ isOpen: true, type: 'error', title: 'خطأ', message: error.message });
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
    <div className="space-y-6 animate-fade-in font-['Tajawal',sans-serif] pb-10 relative">

      {/* ========================================== */}
      {/* 👑 نافذة التنبيهات المخصصة والأنيقة (Custom Alert / Prompt System) */}
      {/* ========================================== */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-scale-up">
            
            {customAlert.type === 'success' && <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100"><CheckCircle2 size={36} /></div>}
            {customAlert.type === 'error' && <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><X size={36} /></div>}
            {customAlert.type === 'confirm' && <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100"><AlertTriangle size={36} /></div>}
            {customAlert.type === 'password' && <div className="w-16 h-16 bg-brand-brown/5 text-brand-brown rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-brown/10"><Lock size={30} /></div>}

            <h3 className="text-xl font-black text-gray-800 mb-2">{customAlert.title}</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-6 whitespace-pre-line">{customAlert.message}</p>

            {customAlert.type === 'password' && (
              <input
                type="text"
                autoFocus
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                placeholder="أدخل الرقم السري للمدير..."
                autoComplete="off"
                data-lpignore="true"
                style={{ WebkitTextSecurity: 'disc' } as any} 
                className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-3 outline-none text-center font-bold mb-6 focus:border-brand-brown transition-all"
              />
            )}

            <div className="flex items-center justify-center gap-3">
              {customAlert.type === 'password' && (
                <>
                  <button onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all">إلغاء</button>
                  <button onClick={handleVerifyPassword} className="flex-1 py-3 bg-brand-brown text-white rounded-xl font-black hover:bg-[#603813] transition-all">تحقق وتأكيد</button>
                </>
              )}
              {customAlert.type === 'confirm' && (
                <>
                  <button onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' })} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold transition-all">تراجع</button>
                  <button onClick={customAlert.onConfirm} disabled={actionLoading} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all flex justify-center items-center gap-2">
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'نعم، احذف الصنف'}
                  </button>
                </>
              )}
              {(customAlert.type === 'success' || customAlert.type === 'error') && (
                <button onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' })} className="w-full py-3 bg-brand-brown text-white rounded-xl font-black hover:bg-[#603813] transition-all">حسناً</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ✏️ شاشة تعديل بيانات المخزون والسعر للمتغير */}
      {/* ========================================== */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-fade-in relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            <h2 className="text-xl font-black mb-1 border-b pb-4 text-gray-800">تعديل بيانات القطعة</h2>

            <div className="bg-[#FBF9F6] p-3 rounded-xl mt-4 mb-6 border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-gray-800 font-black">{selectedProduct.name}</p>
                <p className="text-sm font-bold text-gray-500 mt-1">مقاس: {selectedProduct.size} | لون: {selectedProduct.color}</p>
              </div>
              <div className="bg-brand-brown text-white px-3 py-1 rounded-lg font-mono text-sm shadow-sm">
                {selectedProduct.barcode}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">الكمية الرئيسية:</label>
                  <input
                    type="number" required value={newMainStock} onChange={(e) => setNewMainStock(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-gray-400 text-center text-xl font-black text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-brown mb-2">المتاح للبيع الآن:</label>
                  <input
                    type="number" required value={newRemainingStock} onChange={(e) => setNewRemainingStock(e.target.value)}
                    className="w-full bg-white border-2 border-brand-brown/30 rounded-xl px-4 py-3 outline-none focus:border-brand-brown text-center text-xl font-black text-brand-brown shadow-sm"
                  />
                </div>
              </div>
              
              {/* 🔥 حقل السعر الجديد */}
              <div>
                <label className="block text-sm font-bold text-emerald-600 mb-2 mt-2">سعر البيع للزبون (ج.م):</label>
                <input
                  type="number" required value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-center text-2xl font-black text-emerald-700 shadow-sm"
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

                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-200 p-4 md:p-6 animate-fade-in">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <thead className="bg-[#FBF9F6]">
                          <tr className="text-gray-500 border-b border-gray-100 text-sm">
                            <th className="py-3 px-4 font-black">الكود (SKU)</th>
                            <th className="py-3 px-4 font-black text-center">المقاس</th>
                            <th className="py-3 px-4 font-black text-center">اللون</th>
                            <th className="py-3 px-4 font-black text-center">السعر</th> {/* 🔥 عمود السعر */}
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
                              {/* 🔥 عرض السعر هنا ليكون واضح */}
                              <td className="py-3 px-4 text-center font-black text-emerald-600">{variant.price} ج.م</td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-2 bg-[#FBF9F6] px-3 py-1 rounded-lg border border-gray-200">
                                  <span className="text-gray-400 font-bold text-sm" title="الكمية الرئيسية">{variant.main_stock !== undefined ? variant.main_stock : variant.stock_int}</span>
                                  <span className="text-gray-300">/</span>
                                  <span className={`font-black text-sm ${variant.stock_int <= 3 ? 'text-red-600' : 'text-brand-brown'}`} title="الكمية المتبقية">{variant.stock_int}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 flex justify-center gap-2">
                                <button onClick={() => requireAuth('edit', variant)} className="p-2 text-blue-500 hover:bg-blue-50 hover:shadow-sm rounded-lg transition" title="تعديل الكمية والسعر">
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