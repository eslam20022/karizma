import { supabase } from '../config/supabaseClient';
import type { Product, CartItem } from '../types';

export const productService = {
  // 1. جلب كل المنتجات للمخزن والكاشير
  async fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // 2. إضافة منتج جديد (شامل المقاس واللون تلقائياً بفضل Omit)
  async addProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<boolean> {
    
    // 🚀 التريكة هنا: بننسخ الكمية اللي الكاشير كتبها ونحطها في الكمية الرئيسية كمان
    const dataToInsert = {
      ...productData,
      main_stock: productData.stock_int // أخذ نسخة ككمية رئيسية
    };

    const { error } = await supabase
      .from('products')
      .insert([dataToInsert]);

    if (error) throw new Error(`فشل إضافة المنتج: ${error.message}`);
    return true;
  },

  // 3. تحديث كمية المخزون
  async updateStock(productId: string, newStock: number): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .update({ stock_int: newStock })
      .eq('id', productId);

    if (error) throw new Error("فشل في تحديث المخزون");
    return true;
  },

  // 4. حذف منتج
  async deleteProduct(productId: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw new Error("خطأ في حذف المنتج");
    return true;
  },

  // 5. تأكيد الفاتورة وخصم المخزون مع ترقيم تسلسلي ذكي للوردية
  async processSale(cart: CartItem[], total: number): Promise<any> {
    // أ. حساب رقم الفاتورة التسلسلي بناءً على عدد الفواتير غير المقفلة في الوردية الحالية
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('is_closed', false);

    const nextInvoiceNo = (count || 0) + 1;

    // ب. تسجيل الفاتورة في جدول المبيعات مع رقمها التسلسلي (شاملة المقاس واللون في الـ JSONB)
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([{ total_amount: total, items: cart, invoice_no: nextInvoiceNo, is_closed: false }])
      .select()
      .single();

    if (saleError) throw new Error(`فشل تسجيل الفاتورة: ${saleError.message}`);

    // ج. تحديث كميات المخزون مباشرة لكل منتج في الفاتورة
    for (const item of cart) {
      await supabase
        .from('products')
        .update({ stock_int: item.stock_int - item.quantity })
        .eq('id', item.id);
    }
    
    return sale;
  },

  // 6. 🚀 دالة التحديث
  updateProduct: async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
      
    if (error) {
      console.error("Update Error:", error.message);
      throw new Error("فشل في تحديث بيانات المنتج من قاعدة البيانات");
    }
    return data;
  }
};