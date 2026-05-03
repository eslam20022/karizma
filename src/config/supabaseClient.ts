import { createClient } from '@supabase/supabase-js';

// بنجيب المفاتيح من ملف الـ .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('مفاتيح Supabase مفقودة! تأكد من ملف .env');
}

// إنشاء وتصدير نقطة الاتصال
export const supabase = createClient(supabaseUrl, supabaseAnonKey);