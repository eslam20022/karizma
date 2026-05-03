import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Search, Bell, Package, ShoppingCart, User, Clock, Loader2 } from 'lucide-react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { fetchNotifications, globalSearch } from '../../services/layoutService';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  
  // 🔍 حالات البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 🔔 حالات الإشعارات
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // إغلاق القوائم عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚀 جلب الإشعارات
  useEffect(() => {
    const loadNotifs = async () => {
      const data = await fetchNotifications();
      setNotifications(data);
    };
    loadNotifs();
    
    // (اختياري) ممكن تعمل interval هنا يحدث الإشعارات كل دقيقة
    const interval = setInterval(loadNotifs, 60000); 
    return () => clearInterval(interval);
  }, []);

  // 🚀 لوجيك البحث الشامل (مع Debounce عشان منضغطش على السيرفر)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await globalSearch(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500); // يستنى نص ثانية بعد الكتابة

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const unreadCount = notifications.length;

  const getIconForType = (type: string) => {
    if (type === 'product') return <Package size={16} />;
    if (type === 'order') return <ShoppingCart size={16} />;
    return <User size={16} />;
  };

  const handleResultClick = (link: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(link);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] text-neo-text font-sans transition-colors duration-300" dir="rtl">
      <Sidebar />

      <main className="flex-1 p-4 pt-24 md:p-8 md:pt-8 pb-24 md:pb-8 w-full overflow-x-hidden relative">
        
        {/* الهيدر العلوي */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 px-6 rounded-[1.5rem] shadow-soft border border-gray-100 relative z-40">
          
          {/* 🔍 شريط البحث */}
          <div className="w-full md:w-1/2 relative" ref={searchRef}>
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => searchQuery.length > 0 && setIsSearchOpen(true)}
              placeholder="ابحث عن منتج، طلب، أو عميل..." 
              className="w-full bg-[#FBF9F6] border border-transparent rounded-xl pr-12 pl-4 py-2.5 outline-none focus:bg-white focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-neo-text transition-all placeholder-gray-400"
            />

            {/* 📋 نتائج البحث */}
            {isSearchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden z-50 animate-fade-in max-h-80 overflow-y-auto custom-scrollbar">
                <div className="p-3 text-xs font-bold text-gray-400 border-b border-gray-50 flex justify-between">
                  <span>نتائج البحث عن "{searchQuery}"</span>
                  {isSearching && <Loader2 size={14} className="animate-spin text-brand-sand" />}
                </div>
                
                {!isSearching && searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 font-bold text-sm">لا توجد نتائج مطابقة</div>
                ) : (
                  searchResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleResultClick(result.link)}
                      className="flex items-center gap-3 p-3 hover:bg-[#FBF9F6] transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-sand/10 text-brand-sand flex items-center justify-center shrink-0">
                        {getIconForType(result.type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neo-text">{result.title}</p>
                        <p className="text-xs text-gray-500">{result.subtitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 🔔 الإشعارات والأفاتار */}
          <div className="flex items-center gap-4 relative">
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-brand-brown hover:text-white hover:border-transparent transition-all relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden z-50 animate-fade-in">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-[#FBF9F6]">
                    <h3 className="font-black text-neo-text">طلبات قيد المراجعة</h3>
                    <span className="text-[10px] font-bold text-brand-brown bg-brand-brown/10 px-2 py-1 rounded">{unreadCount} طلب</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 font-bold text-sm">لا توجد طلبات معلقة! 🚀</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} onClick={() => { setIsNotificationsOpen(false); navigate('/orders'); }} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 bg-[#FBF9F6]/50">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                            <ShoppingCart size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-neo-text mb-0.5">طلب {notif.order_number}</p>
                            <p className="text-xs text-gray-500 leading-relaxed mb-2">{notif.customer_name} • {notif.total_amount} ج.م</p>
                            <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                              <Clock size={10} /> {new Date(notif.created_at).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-1 shrink-0"></div>
                        </div>
                      ))
                    )}
                  </div>
                  <Link to="/orders" onClick={() => setIsNotificationsOpen(false)} className="block w-full text-center p-3 text-xs font-bold text-brand-sand hover:text-brand-brown bg-gray-50 transition-colors">
                    إدارة كل الطلبات
                  </Link>
                </div>
              )}
            </div>

            <div className="w-10 h-10 rounded-xl bg-brand-brown text-white flex items-center justify-center font-serif font-black shadow-md border-2 border-white overflow-hidden hidden sm:flex">
              <img src="https://ui-avatars.com/api/?name=Admin&background=5C4033&color=fff" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* 🌟 محتوى الصفحات اللي بيتغير */}
        <div className="animate-fade-in max-w-7xl mx-auto relative z-10">
          <Outlet />    
        </div>
      </main>
    </div>
  );
};