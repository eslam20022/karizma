import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, AlertTriangle, Moon, Sun, PackageOpen, ArrowLeft } from 'lucide-react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { Product } from '../../types';
import logoImg from '../../assets/farook.jpeg'; 
import logoImg2 from '../../assets/faroook.jpeg'; 

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();

  // 🌗 حالات الدارك مود
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🔔 حالات إشعارات المخزون الناقص
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // إغلاق الإشعارات عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚀 جلب المنتجات التي نفدت تماماً (الكمية 0 أو أقل)
  useEffect(() => {
    const checkOutOfStock = async () => {
      try {
        const products = await productService.fetchProducts();
        // 🔴 التعديل هنا: الفلترة بقت للكمية 0 فقط
        const outOfStock = products.filter(p => p.stock_int <= 0);
        setOutOfStockProducts(outOfStock);
      } catch (error) {
        console.error("خطأ في جلب تنبيهات المخزون", error);
      }
    };
    
    checkOutOfStock();
    // فحص المخزون كل 5 ثواني عشان يفضل محدث مع الكاشير
    const interval = setInterval(checkOutOfStock, 5000); 
    return () => clearInterval(interval);
  }, []);

  // 🌗 تفعيل/إلغاء الدارك مود
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const unreadCount = outOfStockProducts.length;

  return (
    // 🎨 استخدام transition عشان التحويل للدارك مود يكون ناعم
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#F5F5F5] text-neo-text'} font-sans`} dir="rtl">
      
      <Sidebar />

      <main className="flex-1 p-4 pt-24 md:p-8 md:pt-8 pb-24 md:pb-8 w-full overflow-x-hidden relative">
        
        {/* ========================================== */}
        {/* 🌟 الهيدر العلوي المروّش */}
        {/* ========================================== */}
        <header className={`flex justify-between items-center mb-8 p-4 px-6 rounded-[1.5rem] shadow-soft border relative z-40 transition-colors duration-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          
          {/* 🖼️ الجزء الأيمن: اللوجو والترحيب */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-sand blur-md opacity-40 rounded-full"></div>
              <img 
                src={logoImg} 
                alt="Karizma Store" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white relative z-10 shadow-sm" 
              />
            </div>
            <div className="hidden sm:block">
              <h2 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>مرحباً بك في Karizma Store ✨</h2>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>إدارة المبيعات والمخزون</p>
            </div>
          </div>

          {/* ⚙️ الجزء الأيسر: الإشعارات والدارك مود */}
          <div className="flex items-center gap-4 relative">
            
            {/* 🌗 زرار الدارك مود */}
            <button 
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-50 text-slate-600 hover:bg-gray-100'}`}
              title={isDarkMode ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
            >
              {isDarkMode ? <Sun size={20} className="animate-spin-slow" /> : <Moon size={20} />}
            </button>

            {/* 🔔 الإشعارات (نواقص المخزون) */}
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all relative ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-brand-brown hover:text-white hover:border-transparent'}`}
              >
                <Bell size={18} className={unreadCount > 0 ? "animate-pulse" : ""} />
                
                {/* النقطة الحمراء بتظهر لو فيه نواقص */}
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* 📋 قائمة النواقص (Dropdown) */}
              {isNotificationsOpen && (
                <div className={`absolute left-0 top-full mt-3 w-80 rounded-2xl shadow-premium border overflow-hidden z-50 animate-fade-in ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                  
                  <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-red-50 border-red-100'}`}>
                    <h3 className={`font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-red-700'}`}>
                      <AlertTriangle size={18} /> الأصناف النافدة
                    </h3>
                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-full shadow-sm">{unreadCount} صنف</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {outOfStockProducts.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <PackageOpen size={40} className={`mb-3 ${isDarkMode ? 'text-slate-600' : 'text-green-200'}`} />
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-400' : 'text-green-600'}`}>المخزون ممتاز! مفيش نواقص حالياً 🎉</p>
                      </div>
                    ) : (
                      outOfStockProducts.map((product) => (
                        <div 
                          key={product.id} 
                          onClick={() => { setIsNotificationsOpen(false); navigate('/products'); }} 
                          className={`p-4 border-b last:border-0 transition-colors cursor-pointer flex items-center gap-3 ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-50 hover:bg-red-50/50'}`}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-100 text-red-600">
                            <span className="font-black text-lg">0</span>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold line-clamp-1 mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</p>
                            <p className="text-[11px] font-bold text-red-500">
                              نفدت الكمية تماماً! {product.size ? `(${product.size} - ${product.color})` : ''}
                            </p>
                          </div>
                          <ArrowLeft size={16} className={`shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-gray-300'}`} />
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* زرار الذهاب للجرد */}
                  <Link 
                    to="/products" 
                    onClick={() => setIsNotificationsOpen(false)} 
                    className={`block w-full text-center p-3 text-sm font-black transition-colors ${isDarkMode ? 'bg-slate-900 text-brand-sand hover:text-white' : 'bg-gray-50 text-brand-brown hover:bg-brand-brown hover:text-white'}`}
                  >
                    الذهاب لإدارة المخزون
                  </Link>
                </div>
              )}
            </div>

            {/* 👤 صورة الأدمن */}
            <div className={`w-12 h-15 rounded-xl flex items-center justify-center font-serif font-black shadow-md border-2 overflow-hidden hidden sm:flex ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-brand-brown border-white text-white'}`}>
              <img src={logoImg2} alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* 🌟 محتوى الصفحات اللي بيتغير (Outlet) */}
        {/* ========================================== */}
        <div className="animate-fade-in max-w-7xl mx-auto relative z-10">
          <Outlet />    
        </div>
      </main>
    </div>
  );
};