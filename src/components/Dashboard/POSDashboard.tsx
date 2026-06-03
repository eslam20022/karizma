import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DollarSign, Receipt, BookOpen, Search, ShoppingCart, Trash2, Printer, Plus, Minus, Loader2, Archive, Lock, X, Shirt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDashboardStats, closeGlobalShift } from '../../services/dashboardService';
import { productService } from '../../services/productService';
import type { Product, CartItem } from '../../types';

export const POSDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [, setLoadingStats] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [printMode, setPrintMode] = useState<'receipt' | 'z-report'>('receipt');
  
  const [discount, setDiscount] = useState<number>(0);

  // 🚀 حالة لفتح نافذة اختيار المتغيرات (المقاس واللون)
  const [selectedModel, setSelectedModel] = useState<{ name: string, variants: Product[] } | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    focusBarcode();
  }, []);

  const loadData = async () => {
    try {
      setLoadingStats(true);
      const [statsData, productsData] = await Promise.all([
        fetchDashboardStats(),
        productService.fetchProducts()
      ]);
      setStats(statsData);
      setProducts(productsData);
    } catch (error) {
      console.error("خطأ في تحميل البيانات", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const focusBarcode = () => {
    setTimeout(() => barcodeRef.current?.focus(), 100);
  };

  // 🚀 تجميع المنتجات بناءً على الاسم لعرضها في الكاشير
  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: { name: string, price: number, totalStock: number, variants: Product[] } } = {};
    
    products.forEach(p => {
      if (!groups[p.name]) {
        groups[p.name] = { name: p.name, price: p.price, totalStock: 0, variants: [] };
      }
      groups[p.name].variants.push(p);
      groups[p.name].totalStock += (p.stock_int || 0);
    });

    const search = barcodeInput.toLowerCase();
    return Object.values(groups).filter(group => 
      group.name.toLowerCase().includes(search) || 
      group.variants.some(v => v.barcode && v.barcode.includes(search))
    );
  }, [products, barcodeInput]);

  const handleProductClick = (group: any) => {
    // لو الموديل فيه قطعة واحدة بس أو كل القطع خلصانة، ممكن نضيفه مباشرة أو نظهر النافذة
    if (group.variants.length === 1) {
      addToCart(group.variants[0]);
    } else {
      setSelectedModel(group);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock_int <= 0) {
      alert('هذا الصنف نفد من المخزن!');
      focusBarcode();
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_int) {
          alert('الكمية المطلوبة تتجاوز المخزون!');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price } : item);
      }
      return [...prev, { ...product, quantity: 1, totalPrice: product.price }];
    });
    
    setBarcodeInput('');
    setSelectedModel(null); // قفل النافذة لو مفتوحة
    focusBarcode();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    // البحث بالباركود الدقيق أولاً (عشان الاسكانر)
    const exactProduct = products.find(p => p.barcode === barcodeInput.trim());
    
    if (exactProduct) {
      addToCart(exactProduct);
    } else {
      // لو ملقاش باركود، هيسيب البحث شغال في الشاشة زي ما هو
      if (groupedProducts.length === 0) alert('لا يوجد صنف بهذا الباركود!');
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > item.stock_int) { alert('تجاوزت المخزون المتاح!'); return item; }
        return { ...item, quantity: Math.max(0, newQ), totalPrice: Math.max(0, newQ) * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0));
    focusBarcode();
  };

  const subTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = subTotal * (discount / 100);
  const finalAmount = subTotal - discountAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoadingCheckout(true);
    try {
      await productService.processSale(cart, finalAmount);
      setPrintMode('receipt');
      setTimeout(() => {
        window.print();
        setCart([]);
        setDiscount(0); 
        loadData();
      }, 100);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingCheckout(false);
      focusBarcode();
    }
  };

  const handleCloseShift = async () => {
    if (!stats || stats.totalInvoices === 0) {
      return alert("لا يوجد مبيعات في هذه الوردية لتقفيلها!");
    }
    const confirmClose = window.confirm("هل أنت متأكد من تقفيل الوردية وتصفير العدادات لبدء يوم جديد؟");
    if (confirmClose) {
      try {
        setPrintMode('z-report');
        setTimeout(async () => {
          window.print();
          await closeGlobalShift();
          setStats({ totalSales: 0, totalInvoices: 0, itemsSold: 0, recentSales: [] });
          setPrintMode('receipt');
          focusBarcode();
          alert("تم إنهاء الوردية وتصفير السيستم بنجاح لليوم الجديد! 🌅");
        }, 500);
      } catch (e: any) {
        alert("خطأ في التقفيل: " + e.message);
        setPrintMode('receipt');
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] gap-6 font-sans relative">

      {/* ========================================== */}
      {/* 📦 نافذة اختيار المقاس واللون (Modal) */}
      {/* ========================================== */}
      {selectedModel && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl animate-fade-in relative">
            <button onClick={() => setSelectedModel(null)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2 text-brand-brown">
              <Shirt size={24} /> {selectedModel.name}
            </h2>
            <p className="text-gray-500 font-bold mb-6 text-sm">اختر القطعة المطلوبة لإضافتها للفاتورة:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {selectedModel.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => addToCart(variant)}
                  disabled={variant.stock_int <= 0}
                  className={`p-4 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                    variant.stock_int <= 0 
                      ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                      : 'bg-white border-brand-sand/30 hover:border-brand-brown hover:shadow-md active:scale-95'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg text-gray-800" dir="ltr">{variant.size || '-'}</span>
                    <span className="text-sm font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{variant.color || '-'}</span>
                  </div>
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100 border-dashed">
                    <span className={`text-xs font-bold ${variant.stock_int <= 3 ? 'text-red-500' : 'text-gray-400'}`}>متاح: {variant.stock_int}</span>
                    <span className="font-mono text-xs text-brand-brown">{variant.barcode}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    {/* ========================================== */}
      {/* 🖨️ الطباعة الحرارية (Karizma Store) */}
      {/* ========================================== */}
      <div className="hidden print:block print-receipt-only bg-white text-black font-sans w-full" dir="rtl">
        
        {/* اللوجو واسم المحل */}
        <div className="flex flex-col items-center justify-center border-b-2 border-black pb-3 mb-3">
          <img src='src/assets/farook.jpeg' alt="Karizma Logo" className="w-20 h-20 object-contain grayscale mb-1" />
          <h1 className="font-black text-2xl tracking-widest uppercase mb-0.5" dir="ltr">KARIZMA</h1>
          <p className="text-[12px] font-bold">Mr. Eslam Mohamed</p>
        </div>

        {printMode === 'receipt' ? (
          <>
            {/* الترويسة الجديدة (بسيطة ومش داخلة في بعضها) */}
            <div className="text-center font-black text-lg mb-2">فاتورة مبيعات</div>
            
            <div className="flex justify-between border-b-2 border-black pb-2 mb-2 text-[12px] font-bold">
              <div className="text-right leading-relaxed">
                <p>رقم الفاتورة: {(stats?.totalInvoices || 0) + 1}</p>
                <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
              </div>
              <div className="text-left leading-relaxed">
                <p>كاشير: الإدارة</p>
                <p>الوقت: {new Date().toLocaleTimeString('ar-EG', { hour12: true })}</p>
              </div>
            </div>

            {/* جدول الأصناف (متظبط مساحاته عشان الكلمة تنزل سطر لو طويلة) */}
    {/* جدول الأصناف (بعد إزالة اللون والمقاس) */}
            <table className="w-full text-right text-[12px] font-bold mb-3">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-1 w-[45%]">الصنف</th>
                  <th className="py-1 text-center w-[15%]">الكمية</th>
                  <th className="py-1 text-center w-[20%]">السعر</th>
                  <th className="py-1 text-left w-[20%]">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} className="border-b border-gray-300 border-dashed">
                    <td className="py-2 pr-1">
                      {/* السطر ده بس اللي هيفضل لاسم الصنف */}
                      <div className="font-black text-[12px] leading-tight">{item.name}</div>
                    </td>
                    <td className="py-2 text-center align-top">{item.quantity}</td>
                    <td className="py-2 text-center align-top">{item.price}</td>
                    <td className="py-2 text-left align-top">{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* الإجماليات */}
            <div className="border-b-2 border-black pb-2 mb-2 font-bold text-[12px]">
              <div className="flex justify-between mb-1 border-b border-dashed border-gray-300 pb-1">
                <span>إجمالي القطع: {cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
                <span>الإجمالي: {subTotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between mb-1 border-b border-dashed border-gray-300 pb-1 text-gray-800">
                  <span>الخصم ({discount}%) :</span>
                  <span>- {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-black mt-2">
                <span>الصافي المطلوب</span>
                <span>{finalAmount.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* التذييل */}
            <div className="text-center text-[12px] font-bold space-y-1 mt-3">
              <p>العنوان: قرية الشركة 2 / بجوار المسجد الكبير</p>
              <p className="flex items-center justify-center gap-1 font-mono text-[10px] mt-1">
                <span>01010839209</span> / <span>01067396488</span> :WhatsApp
              </p>
              <div className="border-t-2 border-dashed border-black mt-2 pt-2">
 <p className="font-black text-[10px]">سياسة الاستبدال والاسترجاع في Karizma Store :
يسعدنا خدمتكم الاستبدال أو الاسترجاع متاح خلال 4 أيام من تاريخ الشراء بشرط إحضار الفاتورة الأصلية وأن تكون القطعة بحالتها الأصلية مع بقاء تيكت الملابس مثبتاً عليها دون إزالة أو تلف.</p>              </div>
                <p className="font-black text-[18px]">خليك مميز وسط الزحمة خليك كاريزما</p>
            </div>
          </>
        ) : (
          /* تقرير اليومية Z-Report يفضل زي ما هو */
          <>
            <div className="text-center border-b-2 border-black pb-2 mb-2 font-bold text-xs bg-gray-100">
              <p className="text-lg">Z-Report (يومية المبيعات)</p>
              <p>تاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
              <p>وقت: {new Date().toLocaleTimeString('ar-EG', { hour12: false })}</p>
            </div>
            <div className="space-y-2 text-lg my-4 font-bold text-sm">
              <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
                <span>إجمالي الفواتير:</span>
                <span>{stats?.totalInvoices || 0}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
                <span>القطع المباعة:</span>
                <span>{stats?.itemsSold || 0}</span>
              </div>
              <div className="flex justify-between font-black text-xl pt-2">
                <span>إجمالي الدرج:</span>
                <span>{stats?.totalSales || 0} ج.م</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================== */}
      {/* 💻 القسم الأيمن: الداش بورد والبحث */}
      {/* ========================================== */}
      <div className="flex-grow flex flex-col gap-6 print:hidden overflow-y-auto custom-scrollbar pr-2">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex justify-center items-center"><DollarSign /></div>
            <div>
              <p className="text-emerald-700 text-xs font-bold">مبيعات الوردية</p>
              <h3 className="text-xl font-black text-emerald-900">{stats?.totalSales || 0} ج.م</h3>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex justify-center items-center"><Receipt /></div>
            <div>
              <p className="text-blue-700 text-xs font-bold">عدد الفواتير</p>
              <h3 className="text-xl font-black text-blue-900">{stats?.totalInvoices || 0} فاتورة</h3>
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex justify-center items-center"><BookOpen /></div>
            <div>
              <p className="text-indigo-700 text-xs font-bold">القطع المباعة</p>
              <h3 className="text-xl font-black text-indigo-900">{stats?.itemsSold || 0} قطعة</h3>
            </div>
          </div>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown" size={24} />
          <input
            ref={barcodeRef} type="text" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="امسح الباركود بالاسكانر أو ابحث باسم الموديل..."
            className="w-full bg-white border border-gray-200 rounded-[1.5rem] pr-14 pl-4 py-5 outline-none focus:border-brand-brown shadow-sm text-lg font-bold text-gray-800"
          />
        </form>

        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 flex-grow grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {groupedProducts.map(group => (
            <button
              key={group.name} 
              onClick={() => handleProductClick(group)} 
              disabled={group.totalStock <= 0}
              className={`relative overflow-hidden p-4 rounded-2xl border text-right flex flex-col justify-between h-32 transition-all active:scale-95 ${group.totalStock <= 0 ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'bg-[#FBF9F6] border-brand-sand/30 hover:border-brand-brown hover:shadow-md'}`}
            >
              <h3 className={`font-black text-[16px] leading-tight line-clamp-2 ${group.totalStock <= 0 ? 'text-gray-400' : 'text-gray-800'}`}>{group.name}</h3>
              <div className="flex justify-between items-end w-full mt-2">
                <span className={`text-xs font-bold ${group.totalStock <= 0 ? 'text-gray-400' : 'text-brand-sand'}`}>متاح: {group.totalStock}</span>
                <span className={`font-black ${group.totalStock <= 0 ? 'text-gray-400' : 'text-brand-brown'}`}>{group.price} ج.م</span>
              </div>

              {group.totalStock <= 0 && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <div className="bg-red-500 text-white px-4 py-1 rounded-full font-black text-xs shadow-sm transform -rotate-12 border-2 border-white">
                    نفدت الكمية
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* 🛒 القسم الأيسر: الفاتورة والإجراءات */}
      {/* ========================================== */}
      <aside className="w-full lg:w-[400px] flex flex-col gap-4 print:hidden shrink-0">

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col flex-grow overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#FBF9F6]">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><ShoppingCart size={18} className="text-brand-brown" /> الفاتورة</h2>
            <span className="bg-brand-brown/10 text-brand-brown px-2 py-1 rounded text-xs font-bold">{cart.length} أصناف</span>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300"><ShoppingCart size={48} className="mb-2 opacity-50" /><p className="font-bold text-sm">الفاتورة فارغة</p></div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-[#FBF9F6] p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-gray-800 text-lg w-full truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-gray-500 mt-1">
                        {item.color} | {item.size} <span className="font-mono text-[10px] text-gray-400 mr-2">({item.barcode})</span>
                      </p>
                    </div>
                    <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-gray-400 hover:text-red-500"><Trash2 size={20} /></button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center bg-white rounded border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-red-500 hover:bg-red-50"><Minus size={18} /></button>
                      <span className="px-3 font-black text-gray-800 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-green-600 hover:bg-green-50"><Plus size={18} /></button>
                    </div>
                    <span className="font-black text-brand-brown text-sm">{item.totalPrice} ج.م</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-gray-900 text-white rounded-t-[2rem]">
            
             <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
              <span>الإجمالي قبل الخصم</span>
              <span className="font-bold">{subTotal.toFixed(2)} ج.م</span>
            </div> 

             <div className="flex justify-between items-center text-sm text-gray-300 border-b border-gray-700 pb-3 mb-3">
              <span>نسبة الخصم (%)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="100"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-center text-white outline-none focus:border-brand-sand font-bold transition-all"
                />
                <span className="text-gray-500 font-bold">%</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-300 font-bold text-xl">الإجمالي الصافي</span>
              <span className="text-3xl font-black text-white">{finalAmount.toFixed(2)} <span className="text-lg text-gray-400">ج.م</span></span>
            </div>

            <button onClick={handleCheckout} disabled={cart.length === 0 || loadingCheckout} className="w-full py-4 bg-brand-brown rounded-xl font-black shadow-lg hover:bg-[#603813] transition-colors disabled:opacity-50 flex justify-center gap-2 text-lg">
              {loadingCheckout ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} />}
              تأكيد وطباعة الفاتورة
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 grid grid-cols-2 gap-3">
          <Link to="/add-product" className="bg-[#FBF9F6] p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 hover:border-brand-brown hover:bg-brand-sand/10 transition-all group">
            <Plus size={20} className="text-brand-brown group-hover:scale-110 transition-transform" />
            <span className="font-bold text-gray-700">إضافة صنف</span>
          </Link>
          <Link to="/inventory" className="bg-[#FBF9F6] p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 hover:border-brand-brown hover:bg-brand-sand/10 transition-all group">
            <Archive size={20} className="text-brand-brown group-hover:scale-110 transition-transform" />
            <span className="font-bold text-gray-700">المخزون والجرد</span>
          </Link>
          <button onClick={handleCloseShift} className="col-span-2 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-all text-red-600 group mt-1">
            <Lock size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-lg font-black">تقفيل اليومية (Z-Report)</span>
          </button>
        </div>

      </aside>
    </div>
  );
};