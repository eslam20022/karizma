import React, { useState, useEffect, useMemo } from 'react';
import { Receipt, Calendar, Loader2, FileText, CalendarDays, TrendingUp, Trash2, Edit, X, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fetchAllSalesHistory } from '../../services/dashboardService';
import { supabase } from '../../config/supabaseClient';

export const DashboardOverview: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'days' | 'months'>('days');

  const [isMonthlyUnlocked, setIsMonthlyUnlocked] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [returnedItems, setReturnedItems] = useState<any[]>([]);

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'password';
    title: string;
    message: string;
    passwordTarget?: 'months' | 'delete' | 'edit';
    targetId?: any;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const [inputPassword, setInputPassword] = useState('');

  const ADMIN_PASSWORD = "eslam2244";

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchAllSalesHistory();
      setSales(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const monthlySummaries = useMemo(() => {
    return sales.reduce((acc: any, sale: any) => {
      const dateObj = new Date(sale.created_at);
      const monthKey = dateObj.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, totalSales: 0, totalCost: 0, totalProfit: 0, itemsSold: 0 };
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

  const handleTabChange = (tab: 'invoices' | 'days' | 'months') => {
    if (tab === 'months' && !isMonthlyUnlocked) {
      setCustomAlert({
        isOpen: true,
        type: 'password',
        title: 'التقارير محمية 🔒',
        message: 'التقارير الشهرية والأرباح محمية.\nالرجاء إدخال كلمة المرور:',
        passwordTarget: 'months'
      });
    } else {
      setActiveTab(tab);
    }
  };

  const handleVerifyPassword = () => {
    if (inputPassword !== ADMIN_PASSWORD) {
      setCustomAlert({
        isOpen: true,
        type: 'error',
        title: 'خطأ في التحقق',
        message: 'كلمة المرور غير صحيحة! غير مصرح لك بإجراء هذه العملية.'
      });
      setInputPassword('');
      return;
    }

    const target = customAlert.passwordTarget;
    const targetId = customAlert.targetId;
    setInputPassword('');
    setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' });

    if (target === 'months') {
      setIsMonthlyUnlocked(true);
      setActiveTab('months');
    } else if (target === 'delete') {
      triggerConfirmDelete(targetId);
    } else if (target === 'edit') {
      const sale = sales.find(s => s.id === targetId);
      setEditingInvoice(JSON.parse(JSON.stringify(sale)));
      setReturnedItems([]);
    }
  };

  const triggerConfirmDelete = (invoiceId: string) => {
    setCustomAlert({
      isOpen: true,
      type: 'confirm',
      title: 'تأكيد الحذف النهائي',
      message: '⚠️ تحذير: هل أنت متأكد من حذف هذه الفاتورة نهائياً؟ سيتم إرجاع جميع محتوياتها إلى المخزن تلقائياً وتعديل الأرباح.',
      onConfirm: () => executeDeleteInvoice(invoiceId)
    });
  };

  const executeDeleteInvoice = async (invoiceId: string) => {
    try {
      setActionLoading(true);
      const invoiceToDelete = sales.find(s => s.id === invoiceId);

      if (invoiceToDelete && invoiceToDelete.items) {
        for (const item of invoiceToDelete.items) {
          const { data: prodData } = await supabase.from('products').select('stock_int').eq('id', item.id).maybeSingle();
          if (prodData) {
            const newStock = (prodData.stock_int || 0) + item.quantity;
            await supabase.from('products').update({ stock_int: newStock }).eq('id', item.id);
          }
        }
      }

      // 🔥 التعديل هنا: تم تغيير orders إلى sales
      const { error } = await supabase.from('sales').delete().eq('id', invoiceId);
      if (error) throw error;

      setSales(prev => prev.filter(sale => sale.id !== invoiceId));
      setCustomAlert({
        isOpen: true,
        type: 'success',
        title: 'تم بنجاح',
        message: '✅ تم حذف الفاتورة بالكامل وإعادة الكميات إلى المخزن بنجاح وتحديث التقارير المالية.'
      });
    } catch (error: any) {
      setCustomAlert({ isOpen: true, type: 'error', title: 'فشل الإجراء', message: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItemFromInvoice = (indexToRemove: number) => {
    const itemToRemove = editingInvoice.items[indexToRemove];
    setReturnedItems(prev => [...prev, itemToRemove]);
    const newTotalAmount = editingInvoice.total_amount - (itemToRemove.price * itemToRemove.quantity);
    const newItems = editingInvoice.items.filter((_: any, idx: number) => idx !== indexToRemove);

    setEditingInvoice({
      ...editingInvoice,
      items: newItems,
      total_amount: Math.max(0, newTotalAmount)
    });
  };

  const handleSaveInvoiceChanges = async () => {
    if (!editingInvoice) return;
    try {
      setActionLoading(true);

      if (returnedItems.length > 0) {
        for (const item of returnedItems) {
          const { data: prodData } = await supabase.from('products').select('stock_int').eq('id', item.id).maybeSingle();
          if (prodData) {
            const newStock = (prodData.stock_int || 0) + item.quantity;
            await supabase.from('products').update({ stock_int: newStock }).eq('id', item.id);
          }
        }
      }

      // 🔥 التعديل هنا: تم تغيير orders إلى sales
      const { error } = await supabase.from('sales').update({
        total_amount: editingInvoice.total_amount,
        items: editingInvoice.items
      }).eq('id', editingInvoice.id);

      if (error) throw error;

      setSales(prev => prev.map(s => s.id === editingInvoice.id ? editingInvoice : s));
      setEditingInvoice(null);
      setReturnedItems([]);

      setCustomAlert({
        isOpen: true,
        type: 'success',
        title: 'تم التحديث',
        message: '✅ تم حفظ تعديلات الفاتورة، وخصم المرتجعات من الشهرية واليومية، وإعادة السلع إلى المخزن بنجاح!'
      });
    } catch (error: any) {
      setCustomAlert({ isOpen: true, type: 'error', title: 'فشل الحفظ', message: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-['Tajawal',sans-serif] pb-10 relative">

      {/* ========================================== */}
      {/* 👑 نافذة التنبيهات المخصصة والأنيقة (Custom Alert / Prompt System) */}
      {/* ========================================== */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-scale-up">

            {customAlert.type === 'success' && <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100"><CheckCircle2 size={36} /></div>}
            {customAlert.type === 'error' && <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><X size={36} /></div>}
            {customAlert.type === 'confirm' && <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100"><AlertTriangle size={36} /></div>}
            {customAlert.type === 'password' && <div className="w-16 h-16 bg-brand-brown/5 text-brand-brown rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-brown/10"><Lock size={30} /></div>}

            <h3 className="text-xl font-black text-gray-800 mb-2">{customAlert.title}</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-6 whitespace-pre-line">{customAlert.message}</p>

            {customAlert.type === 'password' && (
              <input
                type="text" /* 🔥 غيرناها لـ text عشان المتصفح ميتدخلش */
                autoFocus
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                placeholder="أدخل الرقم السري للمدير..."
                autoComplete="off" /* 🔥 منع أي اقتراحات أو حفظ سابق */
                data-lpignore="true" /* 🔥 منع إضافات حفظ الباسوردات زي LastPass */
                style={{ WebkitTextSecurity: 'disc' } as any} className="w-full bg-[#FBF9F6] border border-gray-200 rounded-xl px-4 py-3 outline-none text-center font-bold mb-6 focus:border-brand-brown transition-all"
              />
            )}

            <div className="flex items-center justify-center gap-3">
              {customAlert.type === 'password' && (
                <>
                  <button onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all">إلغاء</button>
                  <button onClick={handleVerifyPassword} className="flex-1 py-3 bg-brand-brown text-white rounded-xl font-black hover:bg-[#603813] transition-all">تحقق وتأكيد</button>
                </>
              )}
              {customAlert.type === 'confirm' && (
                <>
                  <button onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' })} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold transition-all">تراجع</button>
                  <button onClick={customAlert.onConfirm} disabled={actionLoading} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all flex justify-center items-center gap-2">
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'نعم، احذف الفاتورة'}
                  </button>
                </>
              )}
              {(customAlert.type === 'success' || customAlert.type === 'error') && (
                <button onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', message: '' })} className="w-full py-3 bg-brand-brown text-white rounded-xl font-black hover:bg-[#603813] transition-all">حسناً</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 📝 نافذة تعديل الفاتورة (المرتجعات الشيك) */}
      {/* ========================================== */}
      {editingInvoice && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl animate-fade-in relative max-h-[90vh] flex flex-col border border-gray-100">
            <button onClick={() => setEditingInvoice(null)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>

            <h2 className="text-2xl font-black mb-1 text-brand-brown flex items-center gap-2">
              <Edit size={24} /> تعديل فاتورة #{editingInvoice.invoice_no || 1}
            </h2>
            <p className="text-gray-500 font-bold mb-6 text-sm">يمكنك استرجاع أي قطعة للمخزن تلقائياً بالضغط على زر الحذف بجانبها.</p>

            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-3">
              {editingInvoice.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-[#FBF9F6] p-4 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="font-black text-gray-800 text-base">{item.name}</h4>
                    <p className="text-xs font-bold text-gray-400 mt-1">
                      اللون: {item.color || '-'} {item.size ? `| مقاس: ${item.size}` : ''} <span className="bg-brand-brown/5 text-brand-brown text-[10px] px-1.5 py-0.5 rounded mr-2">مباع: {item.quantity} قطع</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-brand-brown text-sm">{(item.price * item.quantity).toFixed(2)} ج.م</span>
                    <button
                      onClick={() => handleRemoveItemFromInvoice(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                      title="استرجاع للمخزن"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {editingInvoice.items.length === 0 && (
                <div className="text-center py-8 text-red-500 font-black text-sm">⚠️ الفاتورة أصبحت فارغة تماماً، يفضل إغلاق هذه النافذة وحذف الفاتورة بالكامل من الخارج.</div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 pb-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-bold text-gray-500">الإجمالي الجديد للفاتورة:</span>
                <span className="text-2xl font-black text-blue-600">{editingInvoice.total_amount.toFixed(2)} ج.م</span>
              </div>

              {returnedItems.length > 0 && (
                <div className="bg-orange-50 text-orange-700 p-3 rounded-xl mb-4 text-xs font-bold border border-orange-100">
                  ⚠️ تنبيه: سيتم إرجاع عدد ({returnedItems.reduce((acc, item) => acc + item.quantity, 0)}) قطع إلى المخزن أوتوماتيكياً فور الحفظ.
                </div>
              )}

              <button
                onClick={handleSaveInvoiceChanges}
                disabled={actionLoading}
                className="w-full bg-brand-brown text-white py-3.5 rounded-xl font-black text-lg hover:bg-[#603813] transition-colors flex justify-center items-center gap-2 shadow-md"
              >
                {actionLoading ? <Loader2 size={22} className="animate-spin" /> : 'حفظ التعديلات وتحديث السيستم 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* العناوين والترويسية الرئيسية للوحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neo-text flex items-center gap-2">
            <FileText className="text-brand-brown" /> التقارير المالية والفواتير
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-bold">متابعة دقيقة للمبيعات، الإيرادات، والأرباح الصافية.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-soft border border-gray-100 overflow-hidden">

        {/* ================= التابات المحمية ================= */}
        <div className="flex border-b border-gray-100 bg-[#FBF9F6]">
          <button
            onClick={() => handleTabChange('months')}
            className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'months' ? 'bg-white text-brand-brown border-b-2 border-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CalendarDays size={20} /> التقارير الشهرية
            {!isMonthlyUnlocked && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md ml-1 font-bold">🔒 محمية</span>}
          </button>
          <button
            onClick={() => handleTabChange('days')}
            className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'days' ? 'bg-white text-brand-brown border-b-2 border-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Calendar size={20} /> اليوميات المقفلة
          </button>
          <button
            onClick={() => handleTabChange('invoices')}
            className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'invoices' ? 'bg-white text-brand-brown border-b-2 border-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Receipt size={20} /> سجل الفواتير
          </button>
        </div>

        <div className="p-6">

          {/* ================= 📊 تقارير الشهور والأرباح المشفرة ================= */}
          {activeTab === 'months' && isMonthlyUnlocked && (
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
                        {new Date(sale.created_at).toLocaleDateString('ar-EG')} <br />
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

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setCustomAlert({ isOpen: true, type: 'password', title: 'صلاحيات الإدارة', message: 'تعديل الفاتورة والمرتجع يتطلب كلمة سر المدير:', passwordTarget: 'edit', targetId: sale.id })}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل الفاتورة (استرجاع منتجات)"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setCustomAlert({ isOpen: true, type: 'password', title: 'صلاحيات الإدارة', message: 'حذف الفاتورة بالكامل يتطلب كلمة سر المدير:', passwordTarget: 'delete', targetId: sale.id })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف الفاتورة بالكامل"
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