import { supabase } from '../config/supabaseClient';

// ==========================================
// 1. جلب الأقسام (علشان صفحة إضافة منتج)
// ==========================================
export const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error("خطأ في جلب الأقسام:", error.message);
    throw new Error(error.message);
  }
  return data;
};

// ==========================================
// 2. جلب المنتجات (علشان صفحة المخزن) 🚀 دي الدالة اللي كانت ناقصة
// ==========================================
export const fetchProducts = async () => {
  // بنجيب المنتج، ونجيب معاه كل المقاسات بتاعته من جدول product_variants
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants(*)
    `)
    .order('created_at', { ascending: false }); // ترتيب من الأحدث للأقدم

  if (error) {
    console.error("خطأ في جلب المنتجات:", error.message);
    throw new Error(error.message);
  }

  return data || [];
};

// ==========================================
// 3. إدخال منتج جديد بالكامل للمخزن
// ==========================================
// ==========================================
// 3. إدخال منتج جديد بالكامل للمخزن (مع رفع الصور) 🚀
// ==========================================
export const addCompleteProduct = async (
  productData: { category_id: string; name: string; description: string; base_price: number },
  variantsData: { size: string; color: string; stock_quantity: number; sku: string }[],
  imageFiles: File[] // 🚀 استقيال مصفوفة الصور هنا
) => {
  
  // أ. رفع الصور للـ Storage أولاً
  const imageUrls: string[] = [];
  
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // رفع الصورة لـ bucket اسمه products (تأكد إنه موجود و Public في Supabase)
      const { error: uploadError } = await supabase.storage
        .from('products') 
        .upload(filePath, file);

      if (uploadError) throw new Error(`فشل رفع الصورة: ${uploadError.message}`);

      // جلب الرابط العام للصورة
      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      imageUrls.push(data.publicUrl);
    }
  }

  // ب. إدخال المنتج الأساسي (مع حفظ الصور)
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert([{
      ...productData,
      image_url: imageUrls.length > 0 ? imageUrls[0] : null, // أول صورة كصورة أساسية (عشان السلة والمتجر)
      image_urls: imageUrls // حفظ كل الصور في العمود الجديد
    }])
    .select()
    .single();

  if (productError) throw new Error(`فشل إضافة المنتج: ${productError.message}`);

  // ج. تجهيز المقاسات وربطها بالمنتج الجديد
  const variantsToInsert = variantsData.map(variant => ({
    ...variant,
    product_id: newProduct.id,
  }));

  // د. إدخال المقاسات
  const { error: variantsError } = await supabase
    .from('product_variants')
    .insert(variantsToInsert);

  if (variantsError) throw new Error(`فشل إضافة المقاسات: ${variantsError.message}`);

  return true;
};

// ==========================================
// 4. تحديث كميات المخزون للمقاسات والألوان
// ==========================================
export const updateProductVariants = async (variantsData: any[]) => {
  // بنستخدم upsert عشان لو الـ ID موجود تعمله Update أوتوماتيك
  const { error } = await supabase
    .from('product_variants')
    .upsert(variantsData);

  if (error) {
    console.error("خطأ في تحديث المخزون:", error.message);
    throw new Error(error.message);
  }
  return true;
};

// ==========================================
// 5. حذف منتج بالكامل
// ==========================================
export const deleteProduct = async (productId: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  // ملاحظة: المقاسات هتتمسح أوتوماتيك لأننا عاملين ON DELETE CASCADE في الـ SQL
  if (error) {
    console.error("خطأ في حذف المنتج:", error.message);
    throw new Error(error.message);
  }
  return true;
};

// ==========================================
// 6. تطبيق عرض فلاش (Flash Deal) مباشر على منتج
// ==========================================
export const applyFlashDeal = async (productId: string, discountPercentage: number) => {
  // 1. جلب بيانات المنتج الحالي
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('base_price, old_price')
    .eq('id', productId)
    .single();

  if (fetchError) throw new Error("فشل في جلب بيانات المنتج");

  // 2. لو المنتج عليه خصم أصلاً، هنحسب على سعره القديم الأساسي، ولو معليهوش هنحسب على سعره الحالي
  const originalPrice = product.old_price ? product.old_price : product.base_price;

  // 3. حساب السعر الجديد (وتقريبه لأقرب رقم صحيح عشان الفواصل)
  const newPrice = Math.round(originalPrice - (originalPrice * (discountPercentage / 100)));

  // 4. تحديث الداتا بيز
  const { error: updateError } = await supabase
    .from('products')
    .update({
      old_price: originalPrice, // نحتفظ بالسعر الأصلي هنا
      base_price: newPrice      // السعر الجديد للبيع
    })
    .eq('id', productId);

  if (updateError) throw new Error("فشل في تطبيق الخصم على المنتج");
  return true;
};

// ==========================================
// 7. إلغاء عرض الفلاش (إرجاع السعر لأصله)
// ==========================================
export const removeFlashDeal = async (productId: string) => {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('old_price')
    .eq('id', productId)
    .single();

  if (fetchError || !product?.old_price) throw new Error("لا يوجد سعر قديم لإرجاعه");

  const { error: updateError } = await supabase
    .from('products')
    .update({
      base_price: product.old_price, // نرجع السعر الأصلي
      old_price: null                // نمسح السعر المشطوب
    })
    .eq('id', productId);

  if (updateError) throw new Error("فشل في إلغاء الخصم");
  return true;
};