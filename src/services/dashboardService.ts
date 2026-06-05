import { supabase } from '../config/supabaseClient';

// 1. 📊 جلب إحصائيات الوردية (بيجيب الفواتير اللي لسه متقفلتش بس!)
export const fetchDashboardStats = async () => {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .eq('is_closed', false) // 🔥 السر هنا: هات المفتوح بس
    .order('created_at', { ascending: false });

  if (error) {
    console.error("خطأ في جلب بيانات المبيعات:", error.message);
    throw new Error("فشل جلب المبيعات");
  }

  const salesData = sales || [];
  const totalSales = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalInvoices = salesData.length;

  let itemsSold = 0;
  salesData.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      itemsSold += sale.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    }
  });

  return {
    totalSales,
    totalInvoices,
    itemsSold,
    recentSales: salesData.slice(0, 5)
  };
};

// 2. 🔒 دالة التقفيل (بتقفل كل الفواتير المفتوحة بضغطة واحدة)
export const closeGlobalShift = async () => {
  const { error } = await supabase
    .from('sales')
    .update({ is_closed: true })
    .eq('is_closed', false); // حول كل المفتوح لمقفول

  if (error) {
    console.error("خطأ في تقفيل الوردية:", error.message);
    throw new Error("فشل في تقفيل الوردية في السيرفر");
  }
  return true;
};

// 3. 📜 جلب كل المبيعات (لصفحة اليوميات - بتجيب كله مفتوح ومقفول)
export const fetchAllSalesHistory = async () => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error("فشل في جلب سجل المبيعات");
  return data || [];
};

// 4. 🗑️ دالة مسح الفاتورة وإرجاع الكميات للمخزن تلقائياً
export const deleteInvoiceAndReturnItems = async (invoiceId: string, items: any[]) => {
  // 1. إرجاع الكميات للمخزن
  if (items && items.length > 0) {
    for (const item of items) {
      const { data: prodData } = await supabase
        .from('products')
        .select('stock_int')
        .eq('id', item.id)
        .maybeSingle();
        
      if (prodData) {
        const newStock = (prodData.stock_int || 0) + item.quantity;
        await supabase.from('products').update({ stock_int: newStock }).eq('id', item.id);
      }
    }
  }
  
  // 2. مسح الفاتورة من جدول 'sales'
  const { error } = await supabase.from('sales').delete().eq('id', invoiceId);
  if (error) throw error;
};

// 5. ✏️ دالة تعديل الفاتورة وإرجاع المرتجعات للمخزن تلقائياً
export const updateInvoiceAndReturnItems = async (invoiceId: string, newTotalAmount: number, newItems: any[], returnedItems: any[]) => {
  // 1. border إرجاع المرتجعات فقط للمخزن
  if (returnedItems && returnedItems.length > 0) {
    for (const item of returnedItems) {
      const { data: prodData } = await supabase
        .from('products')
        .select('stock_int')
        .eq('id', item.id)
        .maybeSingle();
        
      if (prodData) {
        const newStock = (prodData.stock_int || 0) + item.quantity;
        await supabase.from('products').update({ stock_int: newStock }).eq('id', item.id);
      }
    }
  }
  
  // 2. تحديث الفاتورة في جدول 'sales' بالإجمالي الجديد والمنتجات المتبقية
  const { error } = await supabase.from('sales').update({
    total_amount: newTotalAmount,
    items: newItems
  }).eq('id', invoiceId);
  
  if (error) throw error;
};