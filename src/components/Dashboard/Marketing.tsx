import React, { useState, useEffect } from 'react';
import { Gift, RotateCcw, Ticket, Percent, Edit2, Zap, Lock, X, AlertCircle, CheckCircle, Save, Loader2, Trash2, Calendar, Tag, Search, CheckSquare, Square } from 'lucide-react';
import { fetchDiscountCodes, addDiscountCode, deleteDiscountCode, fetchWheelSegments, updateWheelSegments, resetWheelGlobal } from '../../services/marketingService'; 
import { fetchProducts, applyFlashDeal, removeFlashDeal } from '../../services/productService'; 

interface DiscountCode {
  id: string;
  code: string;
  discount_percentage: number;
  current_uses: number;
  max_uses: number;
  expires_at: string | null;
}

interface WheelSegment {
  id: number;
  label: string;
  type: string;
  chance: number;
  color: string;
}

export const Marketing: React.FC = () => {
  const [wheelSegments, setWheelSegments] = useState<WheelSegment[]>([]);
  const [editableWheel, setEditableWheel] = useState<WheelSegment[]>([]);
  const [savingWheel, setSavingWheel] = useState(false);

  const [activeCodes, setActiveCodes] = useState<DiscountCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [savingCode, setSavingCode] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddCodeModalOpen, setIsAddCodeModalOpen] = useState(false);
  const [isEditWheelOpen, setIsEditWheelOpen] = useState(false);
  const [isFlashDealModalOpen, setIsFlashDealModalOpen] = useState(false);

  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false); 

  const [newCode, setNewCode] = useState({ code: '', discount: '', maxUses: '', expiresAt: '' });
  
  // 🚀 رجعنا المتغيرات دي وهنستخدمها دلوقتي في اختيار المنتجات
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [flashDeal, setFlashDeal] = useState({ productId: '', discount: '' });
  const [savingFlashDeal, setSavingFlashDeal] = useState(false);

  const activeFlashDeals = inventory.filter(p => p.old_price && p.old_price > p.base_price);
  
  // 🚀 استخدام متغير البحث
  const filteredInventory = inventory.filter(p => p.name.includes(searchTerm));

  const loadData = async () => {
    try {
      setLoadingCodes(true);
      const [codesData, productsData, wheelData] = await Promise.all([
        fetchDiscountCodes(),
        fetchProducts(),
        fetchWheelSegments()
      ]);
      setActiveCodes(codesData as DiscountCode[]);
      setInventory(productsData);
      setWheelSegments(wheelData);
    } catch (error) {
      console.error("Error loading marketing data", error);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetWheel = async () => {
    if (resetPassword === 'admin123') {
      setIsResetting(true);
      setResetError('');
      
      try {
        await resetWheelGlobal(); 
        setResetSuccess(true);
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetSuccess(false);
          setResetPassword('');
        }, 1500);
      } catch (error) {
        setResetError('حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.');
      } finally {
        setIsResetting(false);
      }
    } else {
      setResetError('كلمة المرور غير صحيحة!');
    }
  };

  // 🚀 رجعنا دالة التحديد وهنستخدمها
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSaveNewCode = async () => {
    if (newCode.code && newCode.discount) {
      setSavingCode(true);
      try {
        const savedCode = await addDiscountCode({
          code: newCode.code.toUpperCase(),
          discount_percentage: Number(newCode.discount),
          max_uses: Number(newCode.maxUses) || 0,
          expires_at: newCode.expiresAt ? new Date(newCode.expiresAt).toISOString() : null
          // يمكن إضافة selectedProducts للداتا بيز مستقبلاً لو الداتا بيز بتدعم ده
        });
        
        setActiveCodes([savedCode as DiscountCode, ...activeCodes]);
        setIsAddCodeModalOpen(false);
        setNewCode({ code: '', discount: '', maxUses: '', expiresAt: '' });
        setSelectedProducts([]);
      } catch (error: any) {
        alert("حدث خطأ أثناء حفظ الكود. قد يكون الكود موجود مسبقاً.");
      } finally {
        setSavingCode(false);
      }
    } else {
      alert('برجاء إكمال بيانات الكود الأساسية (الكود والنسبة).');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (window.confirm('هل أنت متأكد من مسح هذا الكود؟')) {
      try {
        await deleteDiscountCode(codeId);
        setActiveCodes(activeCodes.filter(c => c.id !== codeId));
      } catch (error) {
        alert('حدث خطأ أثناء مسح الكود');
      }
    }
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const openWheelEdit = () => {
    setEditableWheel([...wheelSegments]);
    setIsEditWheelOpen(true);
  };

  const handleSaveWheelSettings = async () => {
    const totalChance = editableWheel.reduce((sum, seg) => sum + Number(seg.chance), 0);
    if (totalChance !== 100) {
      alert(`إجمالي النسب حالياً ${totalChance}%. يجب أن يكون المجموع 100% بالظبط.`);
      return;
    }

    setSavingWheel(true);
    try {
      await updateWheelSegments(editableWheel);
      setWheelSegments(editableWheel);
      setIsEditWheelOpen(false);
    } catch (error) {
      alert('حصل مشكلة في حفظ بيانات العجلة');
    } finally {
      setSavingWheel(false);
    }
  };

  const handleApplyFlashDeal = async () => {
    if (!flashDeal.productId || !flashDeal.discount) {
      alert('برجاء اختيار المنتج وتحديد نسبة الخصم');
      return;
    }
    setSavingFlashDeal(true);
    try {
      await applyFlashDeal(flashDeal.productId, Number(flashDeal.discount));
      await loadData(); 
      setIsFlashDealModalOpen(false);
      setFlashDeal({ productId: '', discount: '' });
    } catch (error) {
      alert('حدث خطأ أثناء تطبيق الخصم');
    } finally {
      setSavingFlashDeal(false);
    }
  };

  const handleRemoveFlashDeal = async (productId: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء الخصم ورجوع المنتج لسعره الأصلي؟')) {
      try {
        await removeFlashDeal(productId);
        await loadData();
      } catch (error) {
        alert('حدث خطأ أثناء إلغاء الخصم');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-['Tajawal',sans-serif]">
      
      <header className="border-b border-gray-200 pb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-brown text-white flex items-center justify-center shadow-md">
          <Gift size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neo-text">التسويق وعجلة الحظ</h1>
          <p className="text-gray-500 text-sm mt-1 font-bold">تحكم في العروض، أكواد الخصم، وهدايا عجلة الحظ</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-soft border border-gray-100 rounded-[2rem] p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-neo-text border-r-4 border-brand-sand pr-3">جوائز عجلة الحظ</h2>
              <button 
                onClick={openWheelEdit}
                className="flex items-center gap-2 bg-[#FBF9F6] text-brand-brown px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-brown hover:text-white transition-all border border-gray-200 shadow-sm"
              >
                <Edit2 size={14} /> تعديل العجلة
              </button>
            </div>

            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl mb-6 text-xs font-bold flex items-center gap-2 border border-blue-100">
              <Zap size={16} /> النظام يقوم بإنشاء "كود عشوائي فريد" لكل عميل يستخدم لمرة واحدة فقط لضمان عدم تسريب الأكواد.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wheelSegments.map((segment) => (
                <div key={segment.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-[#FBF9F6] hover:border-brand-sand transition-colors">
                  <div className="w-8 h-8 rounded-full shadow-sm border-2 border-white shrink-0" style={{ backgroundColor: segment.color }}></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-neo-text">{segment.label}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {segment.type === 'dynamic' ? 'كود متغير تلقائي ⚡' : 'بدون كود'}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] text-gray-400">نسبة الظهور</span>
                    <span className="font-black text-brand-brown text-sm">{segment.chance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-soft border border-gray-100 rounded-[2rem] p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-neo-text border-r-4 border-orange-500 pr-3 flex items-center gap-2">
                <Zap size={20} className="text-orange-500" /> عروض الفلاش المباشرة
              </h2>
              <button 
                onClick={() => setIsFlashDealModalOpen(true)}
                className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-500 hover:text-white transition-all border border-orange-200 shadow-sm"
              >
                + إضافة عرض فلاش
              </button>
            </div>

            <div className="space-y-3">
              {activeFlashDeals.length === 0 ? (
                <p className="text-center text-xs text-gray-400 font-bold py-4">لا توجد عروض فلاش نشطة حالياً</p>
              ) : (
                activeFlashDeals.map(product => {
                  const discountPercentage = Math.round(((product.old_price - product.base_price) / product.old_price) * 100);
                  return (
                    <div key={product.id} className="flex justify-between items-center p-3 rounded-xl border border-orange-200 bg-orange-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0">
                          <img src={product.image_url || 'https://via.placeholder.com/50'} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-neo-text">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
                            <span className="text-red-500 line-through">{product.old_price} ج.م</span>
                            <span className="text-green-600">{product.base_price} ج.م</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded flex items-center gap-1">
                          <Tag size={10} /> خصم {discountPercentage}%
                        </span>
                        <button onClick={() => handleRemoveFlashDeal(product.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors" title="إلغاء الخصم">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="bg-white shadow-soft border border-gray-100 rounded-[2rem] p-6 text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={28} />
            </div>
            <h3 className="text-lg font-black text-neo-text mb-2">تصفير عجلة الحظ</h3>
            <p className="text-xs text-gray-500 font-bold mb-6 leading-relaxed">
              يسمح للعملاء باللعب مرة أخرى. محمي بكلمة مرور.
            </p>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={16} /> تفعيل التصفير
            </button>
          </div>

          <div className="bg-white shadow-soft border border-gray-100 rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-neo-text flex items-center gap-2">
                <Ticket size={20} className="text-brand-brown" /> أكواد يدوية
              </h3>
              <button 
                onClick={() => setIsAddCodeModalOpen(true)}
                className="text-brand-brown bg-brand-brown/10 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-brown hover:text-white transition-colors" 
                title="إضافة كود جديد"
              >
                +
              </button>
            </div>
            
            <div className="space-y-3">
              {loadingCodes ? (
                <div className="flex justify-center py-4"><Loader2 size={24} className="text-brand-brown animate-spin" /></div>
              ) : activeCodes.length === 0 ? (
                <p className="text-center text-xs text-gray-400 font-bold py-4">لا توجد أكواد نشطة</p>
              ) : (
                activeCodes.map(code => (
                  <div key={code.id} className={`flex justify-between items-center p-3 rounded-xl border border-dashed ${isExpired(code.expires_at) ? 'border-red-200 bg-red-50 opacity-70' : 'border-brand-sand/50 bg-brand-sand/5'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black font-mono block text-sm ${isExpired(code.expires_at) ? 'text-red-500' : 'text-brand-brown'}`}>{code.code}</span>
                        {isExpired(code.expires_at) && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">منتهي</span>}
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold block mt-1">
                        {code.max_uses === 0 ? 'لا نهائي' : `الحد: ${code.max_uses}`} • استخدم {code.current_uses}
                      </span>
                      {code.expires_at && !isExpired(code.expires_at) && (
                        <span className="text-[9px] text-orange-500 font-bold flex items-center gap-1 mt-0.5">
                          <Calendar size={10} /> ينتهي: {new Date(code.expires_at).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${isExpired(code.expires_at) ? 'bg-red-400' : 'bg-brand-brown'}`}>
                        <Percent size={10} /> {code.discount_percentage}%
                      </div>
                      <button onClick={() => handleDeleteCode(code.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal 1: التصفير */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-premium animate-fade-in border border-gray-100 text-center relative">
            <button onClick={() => setIsResetModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
              <X size={20} />
            </button>
            
            {resetSuccess ? (
              <div className="py-6 flex flex-col items-center">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="text-xl font-black text-green-600">تم تصفير العجلة بنجاح!</h3>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-neo-text mb-2">تأكيد أمني</h3>
                <p className="text-gray-500 text-sm font-bold mb-6">أدخل كلمة مرور الإدارة لتصفير محاولات اللعب لجميع العملاء.</p>
                
                {resetError && <p className="text-red-500 text-xs font-bold mb-3">{resetError}</p>}
                
                <input 
                  type="password" 
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="كلمة المرور..."
                  className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-3 text-center mb-4 outline-none focus:border-brand-brown"
                />
                
                <button onClick={handleResetWheel} disabled={isResetting} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-colors flex justify-center items-center gap-2">
                  {isResetting ? <Loader2 size={18} className="animate-spin" /> : null}
                  {isResetting ? 'جاري التصفير...' : 'تأكيد التصفير'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: إضافة كود يدوي */}
      {isAddCodeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 shadow-premium animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-neo-text flex items-center gap-2">
                <Ticket size={20} className="text-brand-sand" /> إنشاء كود جديد
              </h3>
              <button onClick={() => setIsAddCodeModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">الكود (مثال: KRM20)</label>
                <input type="text" value={newCode.code} onChange={(e) => setNewCode({...newCode, code: e.target.value})} className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-brown uppercase font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">الخصم %</label>
                <input type="number" value={newCode.discount} onChange={(e) => setNewCode({...newCode, discount: e.target.value})} className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-brown text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">أقصى استخدام (0 = لا نهائي)</label>
                <input type="number" value={newCode.maxUses} onChange={(e) => setNewCode({...newCode, maxUses: e.target.value})} className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-brown text-sm" placeholder="اختياري" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold mb-1 block">تاريخ الانتهاء (اختياري)</label>
                <input type="date" value={newCode.expiresAt} onChange={(e) => setNewCode({...newCode, expiresAt: e.target.value})} className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-brown text-sm" />
              </div>
            </div>

            {/* 🚀 رجعنا مربع اختيار المنتجات اللي كان عامل الإيرور بس دلوقتي شغال صح */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 font-bold mb-2 block">تطبيق على منتجات محددة (اختياري)</label>
              <div className="bg-[#FBF9F6] border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar">
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="ابحث عن منتج..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pr-10 pl-4 py-2 outline-none focus:border-brand-brown text-xs font-bold"
                  />
                </div>
                <div className="space-y-2">
                  {filteredInventory.length === 0 ? (
                    <p className="text-center text-xs text-gray-400">لا توجد منتجات مطابقة</p>
                  ) : (
                    filteredInventory.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100" onClick={() => toggleProductSelection(product.id)}>
                        <div className="flex items-center gap-3">
                          <button className={`text-brand-brown flex items-center justify-center transition-transform ${selectedProducts.includes(product.id) ? 'scale-110' : ''}`}>
                            {selectedProducts.includes(product.id) ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-300" />}
                          </button>
                          <span className="text-xs font-bold text-neo-text">{product.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded-md">{product.base_price} ج</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <button onClick={handleSaveNewCode} disabled={savingCode} className="w-full bg-brand-brown text-white py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                {savingCode ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {savingCode ? 'جاري الحفظ...' : 'حفظ وتفعيل الكود'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: تعديل الجوائز */}
      {isEditWheelOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 shadow-premium animate-fade-in border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-neo-text">تعديل جوائز العجلة</h3>
              <button onClick={() => setIsEditWheelOpen(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {editableWheel.map((seg, idx) => (
                <div key={seg.id} className="flex items-center gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">اسم الجائزة</label>
                    <input 
                      type="text" 
                      value={seg.label}
                      onChange={(e) => {
                        const newWheel = [...editableWheel];
                        newWheel[idx].label = e.target.value;
                        setEditableWheel(newWheel);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-sm font-bold outline-none focus:border-brand-brown"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">النسبة %</label>
                    <input 
                      type="number" 
                      value={seg.chance}
                      onChange={(e) => {
                        const newWheel = [...editableWheel];
                        newWheel[idx].chance = Number(e.target.value);
                        setEditableWheel(newWheel);
                      }}
                      className="w-full text-center bg-white border border-gray-200 rounded-lg py-1.5 text-sm font-bold outline-none focus:border-brand-brown" 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-orange-50 text-orange-600 text-xs font-bold p-3 rounded-xl mb-4 border border-orange-100">
              تنبيه: يجب أن يكون إجمالي النسب 100% بالظبط عشان العجلة تشتغل صح.
            </div>

            <button 
              onClick={handleSaveWheelSettings} 
              disabled={savingWheel}
              className="w-full bg-brand-brown text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {savingWheel ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {savingWheel ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      )}

      {/* Modal 4: إضافة عرض فلاش مباشر */}
      {isFlashDealModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-premium animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-neo-text flex items-center gap-2">
                <Zap size={20} className="text-orange-500" /> إضافة عرض فلاش
              </h3>
              <button onClick={() => setIsFlashDealModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 font-bold mb-1 block">اختر المنتج من المخزن:</label>
              <select 
                value={flashDeal.productId}
                onChange={(e) => setFlashDeal({...flashDeal, productId: e.target.value})}
                className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm font-bold"
              >
                <option value="">-- اضغط لاختيار منتج --</option>
                {inventory.filter(p => !p.old_price).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.base_price} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="text-xs text-gray-500 font-bold mb-1 block">نسبة الخصم %</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="number" 
                  value={flashDeal.discount}
                  onChange={(e) => setFlashDeal({...flashDeal, discount: e.target.value})}
                  placeholder="مثال: 20"
                  className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-3 pl-10 outline-none focus:border-orange-500 text-sm font-bold" 
                />
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <button 
                onClick={handleApplyFlashDeal} 
                disabled={savingFlashDeal || !flashDeal.productId || !flashDeal.discount} 
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
              >
                {savingFlashDeal ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {savingFlashDeal ? 'جاري تطبيق العرض...' : 'تفعيل الخصم الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};