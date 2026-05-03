import { supabase } from '../config/supabaseClient';

// جلب كل أكواد الخصم النشطة
export const fetchDiscountCodes = async () => {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("خطأ في جلب أكواد الخصم:", error.message);
    throw new Error(error.message);
  }
  return data || [];
};

// إضافة كود خصم جديد (مع تاريخ الانتهاء)
// src/services/marketingService.ts

export const addDiscountCode = async (codeData: { 
  code: string; 
  discount_percentage: number; 
  max_uses: number; 
  expires_at: string | null 
}) => {
  // 1. التأكد أن الكود مش موجود قبل كده (Case-Insensitive)
  const { data: existing } = await supabase
    .from('discount_codes')
    .select('code')
    .ilike('code', codeData.code) // بيبحث عن الكود بغض النظر عن الحروف كابيتال أو سمول
    .maybeSingle();

  if (existing) {
    throw new Error(`الكود "${codeData.code}" مسجل بالفعل في النظام، اختر اسماً آخر.`);
  }

  // 2. محاولة الإضافة
  const { data, error } = await supabase
    .from('discount_codes')
    .insert([codeData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error("هذا الكود موجود مسبقاً، يرجى استخدام كود فريد.");
    }
    throw error;
  }
  
  return data;
};

// مسح كود خصم
export const deleteDiscountCode = async (codeId: string) => {
  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', codeId);

  if (error) {
    console.error("خطأ في مسح الكود:", error.message);
    throw new Error(error.message);
  }
  return true;
};

// ==========================================
// إعدادات عجلة الحظ
// ==========================================

// جلب بيانات العجلة
export const fetchWheelSegments = async () => {
  const { data, error } = await supabase
    .from('wheel_segments')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error("خطأ في جلب بيانات العجلة:", error.message);
    throw new Error(error.message);
  }
  return data || [];
};

// تحديث بيانات العجلة
export const updateWheelSegments = async (segments: any[]) => {
  const { error } = await supabase
    .from('wheel_segments')
    .upsert(segments); // Upsert بتعدل البيانات الموجودة

  if (error) {
    console.error("خطأ في تحديث العجلة:", error.message);
    throw new Error(error.message);
  }
  return true;
};

// دالة التصفير العالمي لعجلة الحظ
export const resetWheelGlobal = async () => {
  const { error } = await supabase
    .from('marketing_settings')
    .update({ value: new Date().toISOString() })
    .eq('key', 'wheel_last_reset');

  if (error) throw error;
};