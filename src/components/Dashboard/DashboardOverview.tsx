import React, { useState, useEffect, useMemo } from 'react';
import { Receipt, Calendar, Loader2, FileText, CalendarDays, TrendingUp, Trash2, Edit } from 'lucide-react';
import { fetchAllSalesHistory } from '../../services/dashboardService';
// 🚀 تأكد من إضافة دوال الحذف والتعديل في ملف dashboardService الخاص بك
// import { deleteInvoice, updateInvoice } from '../../services/dashboardService'; 

export const DashboardOverview: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'days' | 'months'>('months');

  // 💡 كلمة السر الخاصة بصلاحيات المدير (تقدر تغيرها من هنا)
  const ADMIN_PASSWORD = "12345";

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchAllSalesHistory();
        setSales(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  // 🧠 1. لوجيك تجميع المبيعات حسب اليوم
  const dailySummaries = useMemo(() => {
    return sales.reduce((acc: any, sale: any) => {
      const date = new Date(sale.created_at).toLocaleDateString('ar-EG');
      if (!acc[date]) {
        acc[date] = { date, totalAmount: 0, invoiceCount: 0, itemsSold: 0 };
      }
      acc[date].totalAmount += Number(sale.total_amount);
      acc[date].invoiceCount += 1;
      
      if (sale.items && Array.isArray(sale.items)) {
        acc[date].itemsSold += sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      }
      return acc;
    }, {});
  }, [sales]);

  // 🧠 2. لوجيك تجميع المبيعات والأرباح حسب الشهر
  const monthlySummaries = useMemo(() => {
    return sales.reduce((acc: any, sale: any) => {
      const dateObj = new Date(sale.created_at);
      const monthKey = dateObj.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          month: monthKey, 
          totalSales: 0,
          totalCost: 0,
          totalProfit: 0,
          itemsSold: 0 
        };
      }
      
      acc[monthKey].totalSales += Number(sale.total_amount);
      
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          acc[monthKey].itemsSold += item.quantity;
          const itemCost = (item.cost_price || 0) * item.quantity;
          acc[monthKey].totalCost += itemCost;
        });
      }
      
      acc[monthKey].totalProfit = acc[monthKey].totalSales - acc[monthKey].totalCost;
      return acc;
    }, {});
  }, [sales]);

  const daysArray = Object.values(dailySummaries);
  const monthsArray = Object.values(monthlySummaries);

  // ==========================================
  // 🚀 دوال الحذف والتعديل للفواتير (محمية بكلمة سر)
  // ==========================================
  const handleDeleteInvoice = async (invoiceId: string) => {
    // 1. طلب كلمة السر أولاً
    const enteredPassword = window.prompt("🔒 مسح الفاتورة يتطلب صلاحيات الإدارة.\nالرجاء إدخال كلمة المرور:");
    
    // لو داس Cancel أو مدخلش حاجة
    if (enteredPassword === null) return; 
    
    // لو كلمة السر غلط
    if (enteredPassword !== ADMIN_PASSWORD) {
      alert("❌ كلمة المرور خاطئة! غير مصرح لك بحذف الفاتورة.");
      return;
    }

    // 2. تأكيد الحذف
    const confirmDelete = window.confirm("⚠️ تحذير: هل أنت متأكد من حذف هذه الفاتورة نهائياً؟\n\n(يجب التأكد من إرجاع الكميات للمخزن يدوياً أو برمجياً من السيرفر).");
    if (!confirmDelete) return;

    try {
      // 💡 قم بتفعيل هذا السطر عند إنشاء دالة الحذف في السيرفر
      // await deleteInvoice(invoiceId);
      
      // تحديث الشاشة فوراً بمسح الفاتورة
      setSales(prev => prev.filter(sale => sale.id !== invoiceId));
      alert("✅ تم حذف الفاتورة بنجاح!");
    } catch (error) {
      console.error("خطأ في حذف الفاتورة", error);
      alert("حدث خطأ أثناء محاولة الحذف.");
    }
  };

  const handleEditInvoice = (sale: any) => {
    // 1. طلب كلمة السر أولاً
    const enteredPassword = window.prompt("🔒 تعديل الفاتورة يتطلب صلاحيات الإدارة.\nالرجاء إدخال كلمة المرور:");
    
    if (enteredPassword === null) return; 
    
    if (enteredPassword !== ADMIN_PASSWORD) {
      alert("❌ كلمة المرور خاطئة! غير مصرح لك بتعديل الفاتورة.");
      return;
    }

    // 2. إدخال القيمة الجديدة
    const newAmount = window.prompt(`تعديل إجمالي الفاتورة رقم #${sale.invoice_no || 1}\nالإجمالي الحالي: ${sale.total_amount} ج.م\n\nأدخل الإجمالي الجديد:`, sale.total_amount);
    
    if (newAmount && !isNaN(Number(newAmount)) && Number(newAmount) !== sale.total_amount) {
      // 💡 قم بتفعيل هذا السطر عند إنشاء دالة التعديل في السيرفر
      // updateInvoice(sale.id, { total_amount: Number(newAmount) });
      
      setSales(prev => prev.map(s => s.id === sale.id ? { ...s, total_amount: Number(newAmount) } : s));
      alert("✅ تم تحديث إجمالي الفاتورة بنجاح!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 size={40} className="text-brand-brown animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-['Tajawal',sans-serif] pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neo-text flex items-center gap-2">
            <FileText className="text-brand-brown" /> التقارير المالية والفواتير
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-bold">متابعة دقيقة للمبيعات، الإيرادات، والأرباح الصافية.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-soft border border-gray-100 overflow-hidden">
        
        {/* ================= التابات ================= */}
        <div className="flex border-b border-gray-100 bg-[#FBF9F6]">
          <button 
            onClick={() => setActiveTab('months')}
            className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'months' ? 'bg-white text-brand-brown border-b-2 border-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CalendarDays size={20} /> التقارير الشهرية
          </button>
          <button 
            onClick={() => setActiveTab('days')}
            className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'days' ? 'bg-white text-brand-brown border-b-2 border-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Calendar size={20} /> اليوميات المقفلة
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'invoices' ? 'bg-white text-brand-brown border-b-2 border-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Receipt size={20} /> سجل الفواتير
          </button>
        </div>

        <div className="p-6">
          
          {/* ================= 📊 تقارير الشهور والأرباح ================= */}
          {activeTab === 'months' && (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                    <th className="py-4 px-4 font-bold rounded-tr-xl">الشهر</th>
                    <th className="py-4 px-4 font-bold text-center">القطع المباعة</th>
                    <th className="py-4 px-4 font-bold text-left">رأس المال (تكلفة البضاعة)</th>
                    <th className="py-4 px-4 font-bold text-left">إجمالي المبيعات (الإيرادات)</th>
                    <th className="py-4 px-4 font-black text-left text-emerald-600 rounded-tl-xl">صافي الربح 💰</th>
                  </tr>
                </thead>
                <tbody>
                  {monthsArray.map((month: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-[#FBF9F6] transition-colors">
                      <td className="py-4 px-4 font-black text-neo-text text-lg">{month.month}</td>
                      <td className="py-4 px-4 text-center font-bold text-brand-sand">{month.itemsSold} قطعة</td>
                      <td className="py-4 px-4 text-left font-bold text-gray-500">
                        {month.totalCost > 0 ? `${month.totalCost.toFixed(2)} ج.م` : <span className="text-xs">غير مسجل</span>}
                      </td>
                      <td className="py-4 px-4 text-left font-black text-blue-600">{month.totalSales.toFixed(2)} ج.م</td>
                      <td className="py-4 px-4 text-left">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <TrendingUp size={16} className="text-emerald-600" />
                          <span className="font-black text-emerald-700 text-lg">
                            {month.totalProfit > 0 ? month.totalProfit.toFixed(2) : '-'} ج.م
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {monthsArray.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400 font-bold">لا توجد مبيعات مسجلة حتى الآن.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= 📅 جدول اليوميات ================= */}
          {activeTab === 'days' && (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-4 px-4 font-bold">التاريخ</th>
                    <th className="pb-4 px-4 font-bold text-center">عدد الفواتير</th>
                    <th className="pb-4 px-4 font-bold text-center">القطع المباعة</th>
                    <th className="pb-4 px-4 font-bold text-left">إجمالي الدرج (الإيرادات)</th>
                  </tr>
                </thead>
                <tbody>
                  {daysArray.map((day: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-[#FBF9F6] transition-colors">
                      <td className="py-4 px-4 font-black text-neo-text">{day.date}</td>
                      <td className="py-4 px-4 text-center font-bold text-gray-600">{day.invoiceCount}</td>
                      <td className="py-4 px-4 text-center font-bold text-brand-sand">{day.itemsSold}</td>
                      <td className="py-4 px-4 text-left font-black text-blue-600">{day.totalAmount.toFixed(2)} ج.م</td>
                    </tr>
                  ))}
                  {daysArray.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400 font-bold">لا يوجد يوميات مسجلة.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= 🧾 سجل الفواتير الفردية ================= */}
          {activeTab === 'invoices' && (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-4 px-4 font-bold">رقم الفاتورة</th>
                    <th className="pb-4 px-4 font-bold">التاريخ والوقت</th>
                    <th className="pb-4 px-4 font-bold w-1/3">محتوى الفاتورة</th>
                    <th className="pb-4 px-4 font-bold text-left">الإجمالي</th>
                    <th className="pb-4 px-4 font-bold text-center">الإجراءات</th> 
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale: any) => (
                    <tr key={sale.id} className="border-b border-gray-50 hover:bg-[#FBF9F6] transition-colors group">
                      <td className="py-4 px-4 font-mono font-black text-brand-brown text-lg">
                        #{sale.invoice_no || 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-neo-text text-sm">
                        {new Date(sale.created_at).toLocaleDateString('ar-EG')} <br/>
                        <span className="text-gray-400">{new Date(sale.created_at).toLocaleTimeString('ar-EG', { hour12: true })}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {sale.items?.map((i: any, idx: number) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">
                              {i.name} {i.size ? `(${i.size})` : ''} x{i.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-left font-black text-blue-600">{sale.total_amount} ج.م</td>
                      
                      {/* 🚀 أزرار التعديل والحذف */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditInvoice(sale)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل الإجمالي"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteInvoice(sale.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف الفاتورة"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sales.length == 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400 font-bold">لا توجد فواتير مسجلة.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};