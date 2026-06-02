import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Printer, Plus, Minus, Loader2 } from 'lucide-react';
import { productService } from '../../services/productService';
import type { Product, CartItem } from '../../types';

export const POSView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // مرجع لحقل الباركود عشان المؤشر يفضل واقف فيه دايماً
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    focusBarcode();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.fetchProducts();
      setProducts(data);
    } catch (error) {
      alert("خطأ في تحميل المخزون");
    }
  };

  const focusBarcode = () => {
    setTimeout(() => barcodeRef.current?.focus(), 100);
  };

  const addToCart = (product: Product) => {
    if (product.stock_int <= 0) {
      alert('عفواً، هذا الصنف نفد من المخزن!');
      focusBarcode();
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_int) {
          alert('لا يوجد كمية كافية في المخزن!');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, totalPrice: product.price }];
    });
    
    setBarcodeInput('');
    focusBarcode();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // البحث بالباركود أو الاسم
    const foundProduct = products.find(p => 
      p.barcode === barcodeInput.trim() || p.name.includes(barcodeInput.trim())
    );

    if (foundProduct) {
      addToCart(foundProduct);
    } else {
      alert('الصنف غير موجود!');
    }
    setBarcodeInput('');
    focusBarcode();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        // التأكد من عدم تجاوز المخزون أو النزول تحت الصفر
        if (newQuantity > item.stock_int) {
          alert('الكمية المطلوبة تتجاوز المخزون المتاح!');
          return item;
        }
        return { 
          ...item, 
          quantity: Math.max(0, newQuantity), 
          totalPrice: Math.max(0, newQuantity) * item.price 
        };
      }
      return item;
    }).filter(item => item.quantity > 0)); // حذف الصنف لو الكمية بقت صفر
    focusBarcode();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // 1. تسجيل الفاتورة وخصم المخزون
      await productService.processSale(cart, total);
      
      // 2. طباعة الفاتورة (تستدعي خصائص الـ @media print)
      window.print();
      
      // 3. تصفير السلة وتحديث المخزون
      setCart([]);
      await loadProducts();
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
      focusBarcode();
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] gap-6 animate-fade-in font-['Tajawal',sans-serif]">
      
      {/* ========================================== */}
      {/* 🖨️ قسم الطباعة المخفي (يظهر فقط في الـ Print) */}
      {/* ========================================== */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-50">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black mb-2">karizma store</h1>
          <p className="text-gray-600 text-sm">تاريخ الفاتورة: {new Date().toLocaleDateString('ar-EG')}</p>
          <p className="text-gray-600 text-sm">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
        <table className="w-full text-right mb-6 border-b-2 border-dashed border-gray-400 pb-4">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2">الصنف</th>
              <th>الكمية</th>
              <th>السعر</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td className="py-2 text-sm font-bold">{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.totalPrice} ج</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className="text-2xl font-black text-left">الإجمالي: {totalAmount.toFixed(2)} ج.م</h2>
        <p className="text-center mt-8 text-sm font-bold">شكراً لزيارتكم!</p>
      </div>

      {/* ========================================== */}
      {/* 💻 واجهة المستخدم العادية */}
      {/* ========================================== */}
      
      {/* القسم الأيمن: المنتجات والبحث */}
      <div className="flex-grow flex flex-col gap-6 print:hidden">
        
        {/* شريط الباركود */}
        <form onSubmit={handleBarcodeSubmit} className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600" size={24} />
          <input 
            ref={barcodeRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="امسح الباركود أو ابحث باسم الصنف ثم اضغط Enter..."
            className="w-full bg-white border-2 border-transparent rounded-[1.5rem] pr-14 pl-4 py-5 outline-none focus:border-blue-500 shadow-sm text-lg font-bold text-slate-800 transition-all"
          />
        </form>

        {/* شبكة المنتجات (الوصول السريع) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex-grow overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock_int <= 0}
                className={`p-4 rounded-2xl border text-right flex flex-col justify-between h-32 transition-all active:scale-95 ${
                  product.stock_int <= 0 
                    ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' 
                    : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div>
                  <h3 className="font-bold text-slate-700 text-sm leading-tight line-clamp-2">{product.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{product.category}</p>
                </div>
                <div className="flex justify-between items-end w-full mt-2">
                  <span className="text-xs font-bold text-slate-500">المخزن: {product.stock_int}</span>
                  <span className="font-black text-blue-600">{product.price} ج</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* القسم الأيسر: سلة الفاتورة */}
      <aside className="w-full lg:w-96 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col print:hidden shrink-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" /> الفاتورة
          </h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{cart.length} أصناف</span>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <ShoppingCart size={64} className="mb-4 opacity-50" />
              <p className="font-bold">ابدأ بمسح الباركود</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-[#FBF9F6] p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-700 text-sm leading-snug pr-2">{item.name}</h4>
                  <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-red-500 hover:bg-red-50 rounded-r-lg"><Minus size={14}/></button>
                    <span className="px-3 font-black text-slate-700 text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-green-600 hover:bg-green-50 rounded-l-lg"><Plus size={14}/></button>
                  </div>
                  <span className="font-black text-blue-600">{item.totalPrice} ج</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-900 rounded-b-[2rem]">
          <div className="flex justify-between items-center mb-6 text-white">
            <span className="text-slate-400 font-bold">الإجمالي المطلوب</span>
            <div className="text-left">
              <span className="text-3xl font-black text-white">{totalAmount.toFixed(2)}</span>
              <span className="text-xs text-blue-400 mr-1 font-bold">ج.م</span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} />}
            {loading ? 'جاري الدفع...' : 'دفع وطباعة الفاتورة'}
          </button>
        </div>
      </aside>

    </div>
  );
};