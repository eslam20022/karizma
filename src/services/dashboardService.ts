import { supabase } from '../config/supabaseClient';

export const fetchDashboardStats = async (timeFilter: string) => {
  let query = supabase.from('orders').select('total_amount, created_at', { count: 'exact' });

  // 📅 لوجيك الفلترة الزمنية
  const now = new Date();
  if (timeFilter === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    query = query.gte('created_at', startOfMonth);
  } else if (timeFilter === 'last_month') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    query = query.gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth);
  }

  const { data: orders, count: totalOrders, error: ordersError } = await query;
  
  if (ordersError) throw ordersError;

  // حساب إجمالي المبيعات (باستثناء المرفوض)
  const totalSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

  // جلب إجمالي العملاء
  const { count: totalCustomers, error: custError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  if (custError) throw custError;

  // جلب أحدث 5 طلبات
  const { data: recentOrders, error: recentError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) throw recentError;

  return {
    totalSales,
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    recentOrders: recentOrders || []
  };
};