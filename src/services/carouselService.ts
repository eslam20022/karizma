import { supabase } from '../config/supabaseClient';

export const fetchCarouselSlides = async () => {
  const { data, error } = await supabase.from('carousel_slides').select('*').order('order_index');
  if (error) throw error;
  return data || [];
};

export const addSlide = async (slideData: any, imageFile: File | null) => {
  let image_url = slideData.image_url || '';

  // لو رفعت صورة جديدة، هتروح لـ Supabase Storage
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('carousel').upload(fileName, imageFile);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('carousel').getPublicUrl(fileName);
    image_url = data.publicUrl;
  }

  const { error } = await supabase.from('carousel_slides').insert([{ ...slideData, image_url }]);
  if (error) throw error;
};

export const deleteSlide = async (id: string) => {
  const { error } = await supabase.from('carousel_slides').delete().eq('id', id);
  if (error) throw error;
};

export const toggleSlideActive = async (id: string, currentStatus: boolean) => {
  const { error } = await supabase.from('carousel_slides').update({ is_active: !currentStatus }).eq('id', id);
  if (error) throw error;
};