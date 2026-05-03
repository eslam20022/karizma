import React, { useState, useEffect } from 'react';
import { CheckCircle, Image as ImageIcon, Phone, User, Receipt, Clock, XCircle, CreditCard, Filter, X, Loader2 } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../services/orderService'; // 🚀 استدعاء الدوال الحقيقية

// شكل البيانات زي ما موجودة في الداتا بيز بالظبط
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  status: 'pending_review' | 'reserved_in_store' | 'cancelled';
  payment_method: string;
  receipt_image_url: string;
  created_at: string;
}

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // عشان نعمل لودينج على الزرار اللي بندوس عليه

  // 🚀 جلب الطلبات من قاعدة البيانات
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchOrders();
        setOrders(data as Order[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  // ⚙️ لوجيك تأكيد الطلب
  const handleConfirm = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, 'reserved_in_store');
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'reserved_in_store' } : order
      ));
    } catch (error) {
      alert("حدث خطأ أثناء التأكيد");
    } finally {
      setActionLoading(null);
    }
  };

  // ⚙️ لوجيك رفض الطلب
  const handleReject = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
    } catch (error) {
      alert("حدث خطأ أثناء الرفض");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewReceipt = (imageUrl: string) => {
    // لو مفيش صورة إيصال هنعرض صورة بديلة مؤقتاً للتجربة
    setReceiptImage(imageUrl || "https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=600&auto=format&fit=crop");
  };

  // فلترة الطلبات
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-fade-in font-['Tajawal',sans-serif]">
      
      <header className="border-b border-gray-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-brown text-white flex items-center justify-center shadow-md shrink-0">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neo-text">مراجعة الطلبات</h1>
            <p className="text-gray-500 text-sm mt-1 font-bold">تأكد من إيصالات الدفع قبل تأكيد حجز القطعة</p>
          </div>
        </div>

        <div className="relative w-full md:w-56">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-sand" size={18} />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 outline-none focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/20 text-sm font-bold text-gray-700 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">جميع الطلبات</option>
            <option value="pending_review">قيد المراجعة ⏳</option>
            <option value="reserved_in_store">تم التأكيد ✅</option>
            <option value="cancelled">مرفوضة ❌</option>
          </select>
        </div>
      </header>

      {/* ⏳ شاشة التحميل */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="text-brand-brown animate-spin" />
          <p className="text-gray-500 font-bold">جاري تحميل الطلبات...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className={`bg-white shadow-soft border border-gray-100 rounded-[2rem] p-6 flex flex-col transition-transform duration-300 hover:-translate-y-1 ${order.status === 'cancelled' ? 'opacity-60 grayscale-[50%]' : ''}`}>
                
                <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block mb-1" dir="ltr">{formatDate(order.created_at)}</span>
                    <h3 className="text-lg font-black text-neo-text tracking-wide">{order.order_number}</h3>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                    order.status === 'pending_review' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                    order.status === 'reserved_in_store' ? 'bg-green-50 text-green-600 border-green-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {order.status === 'pending_review' && <Clock size={14} />}
                    {order.status === 'reserved_in_store' && <CheckCircle size={14} />}
                    {order.status === 'cancelled' && <XCircle size={14} />}
                    
                    {order.status === 'pending_review' ? 'قيد المراجعة' : 
                     order.status === 'reserved_in_store' ? 'تم تأكيد الحجز' : 'مرفوض'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <User size={16} className="text-brand-sand" /> {order.customer_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Phone size={16} className="text-brand-sand" /> <span dir="ltr">{order.customer_phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold bg-[#FBF9F6] px-4 py-2 rounded-xl border border-gray-100 h-fit">
                    <CreditCard size={16} className="text-brand-brown" /> {order.payment_method}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#FBF9F6] p-3 rounded-2xl text-center border border-gray-100">
                    <p className="text-gray-500 text-[10px] md:text-xs font-bold mb-1">الإجمالي</p>
                    <p className="font-black text-neo-text text-sm md:text-base">{order.total_amount}</p>
                  </div>
                  <div className="bg-brand-brown/10 p-3 rounded-2xl text-center border border-brand-brown/20">
                    <p className="text-brand-brown text-[10px] md:text-xs font-bold mb-1">المدفوع (عربون)</p>
                    <p className="font-black text-brand-brown text-sm md:text-base">{order.deposit_amount}</p>
                  </div>
                  <div className="bg-[#FBF9F6] p-3 rounded-2xl text-center border border-gray-100">
                    <p className="text-gray-500 text-[10px] md:text-xs font-bold mb-1">المتبقي</p>
                    <p className="font-black text-gray-600 text-sm md:text-base">{order.remaining_amount}</p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleViewReceipt(order.receipt_image_url)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F5F5F5] text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm border border-transparent"
                  >
                    <ImageIcon size={18} /> عرض الإيصال
                  </button>
                  
                  {order.status === 'pending_review' && (
                    <div className="flex-1 flex gap-2">
                      <button 
                        onClick={() => handleConfirm(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-brown text-white py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all text-sm disabled:opacity-50"
                      >
                        {actionLoading === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        تأكيد
                      </button>
                      <button 
                        onClick={() => handleReject(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-none px-4 flex items-center justify-center bg-red-50 text-red-500 py-3 rounded-xl font-bold border border-red-100 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50" 
                        title="رفض الطلب"
                      >
                        {actionLoading === order.id ? <Loader2 size={20} className="animate-spin" /> : <XCircle size={20} />}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3 bg-white rounded-[2rem] border border-gray-100 border-dashed">
              <Receipt size={40} className="text-gray-300" />
              <p className="text-gray-500 font-bold">لا توجد طلبات مطابقة للبحث.</p>
            </div>
          )}
        </>
      )}

      {/* 🖼️ نافذة عرض الإيصال (Modal) */}
      {receiptImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-4 max-w-md w-full relative animate-fade-in shadow-premium">
            <button 
              onClick={() => setReceiptImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-colors border border-gray-100 z-10"
            >
              <X size={20} />
            </button>
            <h3 className="text-center font-black text-neo-text mb-4">صورة الإيصال المرفق</h3>
            <div className="rounded-2xl overflow-hidden bg-gray-100 min-h-[200px] flex items-center justify-center">
              <img src={receiptImage} alt="Receipt Preview" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
            <button 
              onClick={() => setReceiptImage(null)}
              className="w-full mt-4 bg-[#FBF9F6] text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
};