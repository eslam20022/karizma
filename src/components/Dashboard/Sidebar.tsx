import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Archive, Calculator, LogOut, PlusSquare, Menu, X } from 'lucide-react';

// 🚀 استدعاء اللوجو هنا هو اللي هيخليه يظهر
// (لو الملف ده جوا فولدر Dashboard، يبقى ده المسار الصح لفولدر assets)
import logoImg from '../../assets/farook.jpeg'; 

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'كاشير البيع', path: '/pos', icon: <Calculator size={20} /> },
    { name: 'الفواتير و اليوميات', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'جرد المخزون', path: '/products', icon: <Archive size={20} /> },
    { name: 'إضافة صنف', path: '/add-product', icon: <PlusSquare size={20} /> },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    navigate('/login');
  };

  return (
    <>
      {/* 📱 زرار الموبايل */}
      <div className="md:hidden fixed top-0 right-0 w-full bg-white border-b border-gray-100 p-4 flex items-center justify-between z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          {/* 🖼️ لوجو الموبايل */}
          <img 
            src={logoImg} 
            alt="karizma" 
            className="w-9 h-9 rounded-lg object-contain shadow-sm border border-gray-50" 
          />
          <span className="font-black text-neo-text tracking-wide">karizam store</span>
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

      {/* 🖥️ القائمة الجانبية */}
{/* 🖥️ القائمة الجانبية */}
      <aside className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-white border-l border-gray-100 shadow-soft flex flex-col z-[110] transform transition-transform duration-300 ease-in-out font-['Tajawal',sans-serif] ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        {/* 🎨 التعديل هنا: خلينا المحاذاة عمودية (flex-col) ووسطنا المحتوى */}
        <div className="p-6 border-b border-gray-100 relative flex flex-col items-center justify-center">
          
          {/* زرار القفل للموبايل خليناه حر (absolute) عشان ميبوظش التوسيط */}
          <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-4 left-4 text-gray-400 hover:text-red-500">
            <X size={24} />
          </button>

          {/* 🖼️ اللوجو كبرنا مقاسه شوية (w-16 h-16) واديناه مسافة من تحت (mb-2) */}
          <img 
            src={logoImg} 
            alt="karizma" 
            className="w-13 h-[130px] mb-2 rounded-xl object-contain shadow-sm border border-gray-50 p-1 bg-white" 
          />
          <span className="font-black text-neo-text text-lg tracking-wide text-center">karizma store</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar pt-6 md:pt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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