import { supabase } from '../config/supabaseClient';

// جلب كل العملاء من الداتا بيز
export const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false }); // ترتيب من الأحدث للأقدم

  if (error) {
    console.error("خطأ في جلب العملاء:", error.message);
    throw new Error(error.message);
  }
  return data || [];
};