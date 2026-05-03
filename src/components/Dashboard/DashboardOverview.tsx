import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowLeft, Clock, CheckCircle, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '../../services/dashboardService';

export const DashboardOverview: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState('all_time');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats(timeFilter);
        setStats(data);
      } catch (error) {
        console.error("خطأ في تحميل الإحصائيات", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [timeFilter]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={48} className="text-brand-brown animate-spin" />
        <p className="text-gray-500 font-bold">جاري تحديث الأرقام...</p>
      </div>
    );
  }

  const cards = [
    { title: 'إجمالي المبيعات', value: `${stats.totalSales.toLocaleString()} ج.م`, icon: <DollarSign size={24} />, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'إجمالي الطلبات', value: stats.totalOrders, icon: <ShoppingBag size={24} />, color: 'text-brand-brown', bg: 'bg-brand-brown/10' },
    { title: 'إجمالي العملاء', value: stats.totalCustomers, icon: <Users size={24} />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'النمو', value: '+12%', icon: <TrendingUp size={24} />, color: 'text-brand-sand', bg: 'bg-brand-sand/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-['Tajawal',sans-serif]">
      
      {/* 🚀 الترحيب + الفلتر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neo-text">مرحباً بك في كاريزما 👋</h1>
          <p className="text-gray-500 text-sm mt-2 font-bold">إليك ملخص أداء المتجر الحالي.</p>
        </div>
        
        <div className="relative w-full sm:w-48">
          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-sand" size={18} />
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 outline-none focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-gray-700 shadow-sm appearance-none cursor-pointer"
          >
            <option value="this_month">الشهر الحالي</option>
            <option value="last_month">الشهر السابق</option>
            <option value="all_time">كل الأوقات</option>
          </select>
        </div>
      </div>

      {/* 📊 كروت الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold mb-1">{stat.title}</p>
              <h3 className="text-xl md:text-2xl font-black text-neo-text">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* أحدث الطلبات */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-soft border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-neo-text border-r-4 border-brand-brown pr-3">أحدث الطلبات</h2>
            <Link to="/orders" className="text-xs font-bold text-brand-sand hover:text-brand-brown transition-colors flex items-center gap-1">
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-3 px-2 font-bold">رقم الطلب</th>
                  <th className="pb-3 px-2 font-bold">العميل</th>
                  <th className="pb-3 px-2 font-bold">الإجمالي</th>
                  <th className="pb-3 px-2 font-bold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-[#FBF9F6] transition-colors">
                    <td className="py-4 px-2 font-black text-neo-text">{order.order_number}</td>
                    <td className="py-4 px-2 font-bold text-gray-700">{order.customer_name}</td>
                    <td className="py-4 px-2 font-black text-brand-brown">{order.total_amount} ج.م</td>
                    <td className="py-4 px-2 flex justify-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 w-fit ${
                        order.status === 'pending_review' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {order.status === 'pending_review' ? <Clock size={12} /> : <CheckCircle size={12} />}
                        {order.status === 'pending_review' ? 'مراجعة' : 'مؤكد'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* إجراءات سريعة */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-soft border border-gray-100">
          <h2 className="text-lg font-black text-neo-text border-r-4 border-brand-sand pr-3 mb-6">إجراءات سريعة</h2>
          <div className="space-y-4">
            <Link to="/add-product" className="flex items-center justify-between p-4 rounded-2xl bg-[#FBF9F6] border border-gray-100 hover:border-brand-brown transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-brown/10 text-brand-brown flex items-center justify-center"><ShoppingBag size={18} /></div>
                <span className="font-bold text-gray-700 group-hover:text-brand-brown transition-colors">إضافة منتج</span>
              </div>
              <ArrowLeft size={16} className="text-gray-400 group-hover:text-brand-brown" />
            </Link>
            
            <Link to="/marketing" className="flex items-center justify-between p-4 rounded-2xl bg-[#FBF9F6] border border-gray-100 hover:border-brand-brown transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-sand/10 text-brand-sand flex items-center justify-center">🎁</div>
                <span className="font-bold text-gray-700 group-hover:text-brand-brown transition-colors">عجلة الحظ</span>
              </div>
              <ArrowLeft size={16} className="text-gray-400 group-hover:text-brand-brown" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};