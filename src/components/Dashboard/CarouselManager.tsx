import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, UploadCloud, Trash2, Power, Loader2, Save, Type, Palette } from 'lucide-react';
import { fetchCarouselSlides, addSlide, deleteSlide, toggleSlideActive } from '../../services/carouselService';

export const CarouselManager: React.FC = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالة الفورمة
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    button_text: 'تسوق الآن',
    button_link: '/shop',
    bg_color: '#FBF9F6',
    text_color: '#5C4033'
  });

  const loadSlides = async () => {
    setLoading(true);
    try {
      const data = await fetchCarouselSlides();
      setSlides(data);
    } catch (error) {
      console.error("فشل تحميل السلايدر", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("برجاء إدخال العنوان الرئيسي للسلايد");
    
    setIsSubmitting(true);
    try {
      await addSlide(formData, imageFile);
      setFormData({ title: '', subtitle: '', badge_text: '', button_text: 'تسوق الآن', button_link: '/shop', bg_color: '#FBF9F6', text_color: '#5C4033' });
      setImageFile(null);
      await loadSlides();
    } catch (error) {
      alert("حدث خطأ أثناء إضافة السلايد!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("متأكد إنك عايز تحذف السلايد ده؟")) {
      try {
        await deleteSlide(id);
        setSlides(slides.filter(s => s.id !== id));
      } catch (error) {
        alert("فشل الحذف");
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSlideActive(id, currentStatus);
      setSlides(slides.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    } catch (error) {
      alert("فشل تغيير الحالة");
    }
  };

  const inputClass = "w-full bg-[#F5F5F5] border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-brand-sand transition-all";

  return (
    <div className="space-y-8 animate-fade-in font-['Tajawal',sans-serif]">
      
      <header className="border-b border-gray-200 pb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-brown text-white flex items-center justify-center shadow-md">
          <ImageIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neo-text">إدارة الواجهة الرئيسية</h1>
          <p className="text-gray-500 text-sm mt-1 font-bold">تحكم في السلايدر، الصور، الألوان والنصوص المعروضة للزبائن.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* إضافة سلايد جديد */}
        <div className="xl:col-span-1 bg-white rounded-[2rem] p-6 md:p-8 shadow-soft border border-gray-100 h-fit">
          <h2 className="text-lg font-black text-neo-text border-r-4 border-brand-sand pr-3 mb-6">إضافة سلايد جديد</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">النص المصغر (Badge)</label>
              <input type="text" name="badge_text" placeholder="مثال: جديدنا لعام 2026" value={formData.badge_text} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">العنوان الرئيسي</label>
              <input type="text" name="title" placeholder="مثال: تميز بشخصيتك" value={formData.title} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">الوصف الفرعي</label>
              <input type="text" name="subtitle" placeholder="أرقى ملابس الشارع بمقاييس عالمية" value={formData.subtitle} onChange={handleChange} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">نص الزرار</label>
                <input type="text" name="button_text" value={formData.button_text} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">رابط الزرار</label>
                <input type="text" name="button_link" value={formData.button_link} onChange={handleChange} dir="ltr" className={`${inputClass} text-left`} />
              </div>
            </div>

            {/* الألوان */}
            <div className="grid grid-cols-2 gap-4 bg-[#FBF9F6] p-4 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Palette size={12} /> لون الخلفية</label>
                <input type="color" name="bg_color" value={formData.bg_color} onChange={handleChange} className="w-full h-10 rounded-lg cursor-pointer border-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Type size={12} /> لون النص</label>
                <input type="color" name="text_color" value={formData.text_color} onChange={handleChange} className="w-full h-10 rounded-lg cursor-pointer border-none" />
              </div>
            </div>

            {/* صورة السلايد */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">صورة الموديل/المنتج (بدون خلفية أفضل)</label>
              <div className="relative">
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${imageFile ? 'border-brand-sand bg-brand-sand/5' : 'border-gray-300 hover:border-brand-brown'}`}>
                  {imageFile ? (
                    <span className="text-sm font-bold text-brand-brown line-clamp-1">{imageFile.name}</span>
                  ) : (
                    <>
                      <UploadCloud size={24} className="text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-500">اختر صورة للسلايد</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-brand-brown text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-2">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSubmitting ? 'جاري الحفظ...' : 'إضافة السلايد'}
            </button>
          </form>
        </div>

        {/* عرض السلايدر الحالي */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-neo-text border-r-4 border-brand-brown pr-3 mb-6">السلايدر المتاحة</h2>
          
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-brand-brown" /></div>
          ) : slides.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-soft">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-bold">لا يوجد أي سلايدر، أضف واحد جديد.</p>
            </div>
          ) : (
            slides.map((slide) => (
              <div key={slide.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center group transition-all hover:shadow-md">
                
                {/* معاينة مصغرة للسلايد */}
                <div 
                  className="w-full sm:w-48 h-32 rounded-2xl flex items-center justify-between px-4 shrink-0 overflow-hidden relative"
                  style={{ backgroundColor: slide.bg_color }}
                >
                  <div className="space-y-1 z-10 w-2/3">
                    <p className="text-[8px] font-bold opacity-80" style={{ color: slide.text_color }}>{slide.badge_text}</p>
                    <h3 className="text-sm font-black leading-tight line-clamp-2" style={{ color: slide.text_color }}>{slide.title}</h3>
                  </div>
                  {slide.image_url && (
                    <img src={slide.image_url} alt="" className="h-28 object-contain absolute left-0 bottom-0 mix-blend-multiply opacity-90" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-neo-text">{slide.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{slide.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* زر التفعيل / الإيقاف */}
                      <button 
                        onClick={() => handleToggle(slide.id, slide.is_active)}
                        className={`p-2 rounded-lg transition-colors ${slide.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-green-50'}`}
                        title={slide.is_active ? 'مفعل' : 'معطل'}
                      >
                        <Power size={16} />
                      </button>
                      {/* زر الحذف */}
                      <button onClick={() => handleDelete(slide.id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{slide.bg_color} (خلفية)</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{slide.text_color} (نص)</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};