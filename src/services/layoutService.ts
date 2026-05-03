import { supabase } from '../config/supabaseClient';

// 1. جلب الإشعارات (الطلبات اللي قيد المراجعة)
export const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, total_amount, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(5); // نجيب أحدث 5 بس

  if (error) {
    console.error("خطأ في جلب الإشعارات:", error.message);
    return [];
  }
  return data || [];
};

// 2. البحث الشامل في כל الداتا بيز (منتجات، عملاء، طلبات)
export const globalSearch = async (query: string) => {
  if (!query || query.length < 2) return [];

  // بنبعت 3 استعلامات في نفس الوقت عشان السرعة
  const [productsRes, ordersRes, customersRes] = await Promise.all([
    supabase.from('products').select('id, name, base_price').ilike('name', `%${query}%`).limit(3),
    supabase.from('orders').select('id, order_number, customer_name').or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%`).limit(3),
    supabase.from('customers').select('id, name, phone').or(`name.ilike.%${query}%,phone.ilike.%${query}%`).limit(3)
  ]);

  const results: any[] = [];
  
  productsRes.data?.forEach(p => results.push({ id: p.id, type: 'product', title: p.name, subtitle: `${p.base_price} ج.م`, link: '/products' }));
  ordersRes.data?.forEach(o => results.push({ id: o.id, type: 'order', title: o.order_number, subtitle: o.customer_name, link: '/orders' }));
  customersRes.data?.forEach(c => results.push({ id: c.id, type: 'user', title: c.name, subtitle: c.phone, link: '/users' }));

  return results;
};