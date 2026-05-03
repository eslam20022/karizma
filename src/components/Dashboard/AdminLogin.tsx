import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🔐 البيانات الثابتة للأدمن (تقدر تغيرهم من هنا)
  const ADMIN_EMAIL = "admin@karizma.com";
  const ADMIN_PASSWORD = "admin123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // حفظ حالة الدخول في SessionStorage (بتتمسح لما تقفل المتصفح)
      sessionStorage.setItem('admin_auth', 'true');
      navigate('/'); // التحويل للرئيسية
    } else {
      setError('بيانات الدخول غير صحيحة!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-4 font-['Tajawal',sans-serif]" dir="rtl">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-premium border border-gray-100 w-full max-w-md animate-fade-in">
        
        {/* اللوجو */}
        <div className="w-20 h-20 rounded-3xl bg-brand-brown text-white flex items-center justify-center text-4xl font-serif font-black mx-auto mb-8 shadow-lg">
          K
        </div>

        <h1 className="text-2xl font-black text-neo-text text-center mb-2">لوحة الإدارة</h1>
        <p className="text-gray-500 text-center mb-8 font-bold text-sm">برجاء تسجيل الدخول للمتابعة</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-transparent focus:bg-white focus:border-brand-sand rounded-xl px-12 py-4 text-sm font-bold outline-none transition-all"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-transparent focus:bg-white focus:border-brand-sand rounded-xl px-12 py-4 text-sm font-bold outline-none transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-brown text-white py-4 rounded-2xl font-black text-lg shadow-md hover:bg-opacity-90 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-4"
          >
            <LogIn size={20} />
            دخول النظام
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-10 font-bold">
          © 2026 كاريزما - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};