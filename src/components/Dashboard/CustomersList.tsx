import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Mail, Phone, ShoppingBag, Star, Filter, Loader2 } from 'lucide-react';
import { fetchCustomers } from '../../services/customerService'; // 🚀 الاستدعاء

// شكل بيانات العميل في الداتا بيز
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  orders_count: number;
  total_spent: number;
  is_vip: boolean;
  created_at: string;
}

export const CustomersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('newest');
  
  // 🚀 حالات الداتا بيز
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب العملاء أول ما الصفحة تفتح
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await fetchCustomers();
        setCustomers(data as Customer[]);
      } catch (error) {
        console.error("فشل في تحميل العملاء");
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  // 🧠 اللوجيك: دمج البحث مع الفلترة والترتيب
  const processedCustomers = useMemo(() => {
    let result = customers.filter(c => 
      c.name.includes(searchTerm) || c.phone.includes(searchTerm)
    );

    result.sort((a, b) => {
      switch (filterType) {
        case 'newest': // الأحدث انضماماً
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': // الأقدم
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_orders': // الأكثر طلباً
          return b.orders_count - a.orders_count;
        case 'inactive': // غير نشطين (الأقل طلباً)
          return a.orders_count - b.orders_count;
        default:
          return 0;
      }
    });

    return result;
  }, [searchTerm, filterType, customers]);

  // دالة لتنسيق التاريخ بشكل شيك
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in font-['Tajawal',sans-serif]">
      
      {/* 📋 هيدر الصفحة والبحث والفلتر */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-gray-200 pb-6">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-brown text-white flex items-center justify-center shadow-md shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neo-text">سجل العملاء</h1>
            <p className="text-gray-500 text-sm mt-1 font-bold">إدارة بيانات العملاء ومتابعة نشاطهم الشرائي</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          
          <div className="relative w-full sm:w-48">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-sand" size={18} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 outline-none focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-gray-700 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="newest">الأحدث انضماماً</option>
              <option value="oldest">الأقدم انضماماً</option>
              <option value="most_orders">الأكثر طلباً (VIP)</option>
              <option value="inactive">غير نشطين (الأقل طلباً)</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو رقم الموبايل..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 outline-none focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-neo-text transition-all shadow-sm"
            />
          </div>

        </div>
      </header>

      {/* ⏳ شاشة التحميل */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="text-brand-brown animate-spin" />
          <p className="text-gray-500 font-bold">جاري تحميل بيانات العملاء...</p>
        </div>
      ) : (
        /* 👥 جدول العملاء */
        <div className="bg-white shadow-soft border border-gray-100 rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#FBF9F6]">
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="py-4 px-6 font-black">العميل</th>
                  <th className="py-4 px-6 font-black">التواصل</th>
                  <th className="py-4 px-6 font-black text-center">الطلبات</th>
                  <th className="py-4 px-6 font-black text-center">إجمالي المدفوعات</th>
                  <th className="py-4 px-6 font-black text-center">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody>
                {processedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-50 hover:bg-[#FBF9F6] transition-colors">
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-brown/10 text-brand-brown flex items-center justify-center font-bold text-lg border border-brand-brown/20 shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-neo-text flex items-center gap-2">
                            {customer.name}
                            {customer.is_vip && <Star size={14} className="text-yellow-500" fill="currentColor"/>}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-mono" title={customer.id}>
                            {customer.id.substring(0, 8)}... {/* بنعرض جزء من الـ ID عشان ميبوظش الشكل */}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <Phone size={14} className="text-brand-sand shrink-0" /> <span dir="ltr">{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={14} className="text-brand-sand shrink-0" /> {customer.email || 'لا يوجد إيميل'}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border ${
                        customer.orders_count === 0 
                        ? 'bg-red-50 text-red-600 border-red-100' 
                        : 'bg-[#FBF9F6] text-gray-700 border-gray-200'
                      }`}>
                        <ShoppingBag size={14} /> {customer.orders_count}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center font-black text-brand-brown">
                      {customer.total_spent.toLocaleString()} <span className="text-[10px]">ج.م</span>
                    </td>

                    <td className="py-4 px-6 text-center text-xs font-bold text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
            
            {processedCustomers.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                <Users size={40} className="text-gray-300" />
                <p className="text-gray-500 font-bold">لم يتم العثور على عملاء.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};