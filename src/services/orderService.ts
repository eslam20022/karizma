import { supabase } from '../config/supabaseClient';

// جلب كل الطلبات
export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false }); // ترتيب من الأحدث للأقدم

  if (error) {
    console.error("خطأ في جلب الطلبات:", error.message);
    throw new Error(error.message);
  }
  return data || [];
};

// تحديث حالة الطلب (تأكيد أو رفض)
export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    console.error("خطأ في تحديث حالة الطلب:", error.message);
    throw new Error(error.message);
  }
  return true;
};