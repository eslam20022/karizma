import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Gift, LogOut, PlusSquare, Menu, X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'المنتجات', path: '/products', icon: <ShoppingBag size={20} /> },
    { name: 'إضافة منتج', path: '/add-product', icon: <PlusSquare size={20} /> },
    { name: 'الطلبات', path: '/orders', icon: <ShoppingCart size={20} /> },
    { name: 'العملاء', path: '/users', icon: <Users size={20} /> },
    { name: 'التسويق والعروض', path: '/marketing', icon: <Gift size={20} /> },
    { name: 'السلايدر', path: '/CarouselManager', icon: <LayoutDashboard size={20} /> },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    navigate('/login');
  };

  return (
    <>
      {/* 📱 زرار الموبايل (z-[100] عشان يبقى فوق كل حاجة) */}
      <div className="md:hidden fixed top-0 right-0 w-full bg-white border-b border-gray-100 p-4 flex items-center justify-between z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-brown text-white flex items-center justify-center font-serif font-black shadow-md">K</div>
          <span className="font-black text-neo-text tracking-wide">الإدارة</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="text-gray-600 hover:text-brand-brown transition-colors">
          <Menu size={28} />
        </button>
      </div>

      {/* 🌑 خلفية سوداء شفافة للموبايل */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[105] backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🖥️ القائمة الجانبية (z-[110] عشان تطلع فوق الخلفية السودا) */}
      <aside className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-white border-l border-gray-100 shadow-soft flex flex-col z-[110] transform transition-transform duration-300 ease-in-out font-['Tajawal',sans-serif] ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-brown text-white flex items-center justify-center font-serif text-xl font-black shadow-md">K</div>
            <span className="font-black text-neo-text text-lg tracking-wide">الإدارة</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar pt-6 md:pt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'} 
              onClick={() => setIsOpen(false)} 
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isActive ? 'bg-brand-brown text-white shadow-md' : 'text-gray-500 hover:bg-[#FBF9F6] hover:text-brand-brown'}`}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white">
           <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={20} />
              تسجيل الخروج
           </button>
        </div>
      </aside>
    </>
  );
};