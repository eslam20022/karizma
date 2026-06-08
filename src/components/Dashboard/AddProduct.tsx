import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Save, Loader2, CheckCircle, AlertCircle, Hash, Printer, Percent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import JsBarcode from 'jsbarcode';

// 🚀 دالة توليد 4 أرقام عشوائية لاسم الموديل
const generateRandomName = () => Math.floor(1000 + Math.random() * 9000).toString();

// 🚀 دالة حساب السعر الذكية (بنسبة متغيرة يحددها المستخدم)
const calculateFinalPrice = (cost: string | number, markupPercent: string | number) => {
  const num = Number(cost);
  const markup = Number(markupPercent);
  if (!num || isNaN(num) || isNaN(markup)) return 0;
  
  // إضافة النسبة المئوية
  const priceWithMarkup = num + (num * (markup / 100));
  
  // رفع الكسور لأقرب 10 (مثال: 151 أو 155 أو 159 تصبح 160)
  return Math.ceil(priceWithMarkup / 10) * 10;
};

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  // 🔥 حالة للتحكم في نسبة الربح المضافة (الافتراضي 50%)
  const [markupPercentage, setMarkupPercentage] = useState<number | string>(50);

  // 1. البيانات الأساسية للمنتج (الاسم المبدئي عشوائي وسيتأكد السيستم من عدم تكراره)
  const [product, setProduct] = useState({ 
    name: generateRandomName(), 
    base_price: '', 
    category: 'تيشرتات' 
  });
  
  // 2. المتغيرات (المقاس، اللون، الكمية، الكود)
  const [variants, setVariants] = useState([
    { size: '', color: '#000000', colorName: 'أسود', stock_quantity: '', sku: '' }
  ]);

  // 🖨️ إعدادات طباعة الباركود
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const [printData, setPrintData] = useState<any>(null);

  // السعر النهائي اللي هيتعرض ويتحفظ بناءً على التكلفة ونسبة الربح
  const finalSellingPrice = calculateFinalPrice(product.base_price, markupPercentage);

  // تحديث رسمة الباركود لما نختار صنف للطباعة
  useEffect(() => {
    if (printData?.sku && barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, printData.sku, {
          format: "CODE128", 
          lineColor: "#000",
          width: 2,
          height: 40,
          displayValue: false, // لإخفاء الأرقام من تحت خطوط الباركود
          fontSize: 12,
        });
      } catch (error) {
        console.error("خطأ في توليد الباركود", error);
      }
    }
  }, [printData]);

  // دالة تشغيل الطباعة لمتغير محدد
  const handlePrintVariant = (variant: any) => {
    if (!product.name || !product.base_price) {
      return alert('يرجى كتابة اسم الموديل وسعر التكلفة أولاً قبل الطباعة!');
    }
    if (!variant.sku) {
      return alert('لا يوجد كود (SKU) لطباعته!');
    }

    setPrintData({
      name: product.name,
      price: finalSellingPrice,
      size: variant.size,
      sku: variant.sku
    });

    setTimeout(() => {
      window.print();
    }, 150);
  };

  // 🚀 التعديل هنا: جلب البيانات لفحص الكود واسم الموديل معاً
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const existingProducts = await productService.fetchProducts();
        
        // 1. توليد كود (SKU) جديد غير مكرر
        const codes = existingProducts.map(p => parseInt(p.barcode)).filter(n => !isNaN(n));
        const maxCode = codes.length > 0 ? Math.max(...codes) : 99;
        updateVariant(0, 'sku', (maxCode + 1).toString());

        // 2. التحقق من عدم تكرار الاسم العشوائي
        const existingNames = existingProducts.map(p => p.name.trim());
        let safeName = product.name;
        // لو الاسم العشوائي طلع موجود قبل كده، هيفضل يولد اسم جديد لحد ما يجيب واحد فريد
        while (existingNames.includes(safeName)) {
          safeName = generateRandomName();
        }
        
        // تحديث الاسم لو كان مكرر واتغير
        if (safeName !== product.name) {
          setProduct(prev => ({ ...prev, name: safeName }));
        }

      } catch (error) {
        console.error("خطأ في جلب البيانات المبدئية", error);
        updateVariant(0, 'sku', '100');
      } finally {
        setFetchingCode(false);
      }
    };
    fetchInitialData();
  }, []);

  const addVariantRow = () => {
    const lastSku = variants[variants.length - 1].sku;
    const nextSku = lastSku && !isNaN(Number(lastSku)) ? (Number(lastSku) + 1).toString() : '';
    setVariants([...variants, { size: '', color: '#000000', colorName: '', stock_quantity: '', sku: nextSku }]);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariantRow = (index: number) => {
    if (variants.length === 1) return alert("يجب أن يحتوي المنتج على متغير واحد على الأقل");
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  // ==========================================
  // 🚀 دالة الحفظ مع جدار الحماية ضد تكرار الأسماء والأكواد
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      if (variants.length === 0 || !variants[0].size) throw new Error("يجب إضافة مقاس واحد على الأقل!");
      
      // 1. التحقق من عدم وجود تكرار للأكواد داخل الفورم الحالي نفسه
      const skusInForm = variants.map(v => v.sku.trim());
      const uniqueSkusInForm = new Set(skusInForm);
      if (skusInForm.length !== uniqueSkusInForm.size) {
        throw new Error("يوجد تكرار في الأكواد (SKU) داخل الموديل الحالي! يجب أن يكون لكل مقاس ولون كود فريد.");
      }

      // جلب جميع المنتجات من المخزن للتحقق
      const existingProducts = await productService.fetchProducts();
      
      // 2. 🛡️ التحقق من عدم تكرار اسم الموديل (لمنع الدمج)
      const existingNames = existingProducts.map(p => p.name.trim());
      if (existingNames.includes(product.name.trim())) {
        throw new Error(`اسم الموديل (${product.name}) مسجل بالفعل! يرجى تغييره لتجنب دمج المنتجات معاً.`);
      }

      // 3. 🛡️ التحقق من عدم تكرار الأكواد في المخزن
      const existingBarcodes = existingProducts.map(p => p.barcode.trim());
      for (const variant of variants) {
        if (!variant.sku) throw new Error("تأكد من إدخال الأكواد (SKU) لكل القطع");
        
        if (existingBarcodes.includes(variant.sku.trim())) {
          throw new Error(`الكود (${variant.sku}) مسجل بالفعل لمنتج آخر في المخزن! يرجى تغييره.`);
        }
      }
      
      // 4. إذا كانت جميع البيانات سليمة وفريدة، نقوم بالحفظ
      for (const variant of variants) {
        await productService.addProduct({
          name: product.name.trim(),
          category: product.category,
          price: finalSellingPrice, 
          cost_price: Number(product.base_price),
          barcode: variant.sku.trim(),
          size: variant.size.toUpperCase(),
          color: variant.colorName || 'بدون لون',
          stock_int: Number(variant.stock_quantity),
        });
      }

      setMessage({ text: 'تم إضافة الموديل بجميع متغيراته للمخزن بنجاح!', isError: false });
      setTimeout(() => navigate('/inventory'), 1500); // 🚀 خليتها تروح لصفحة المخزون عشان تتأكد إنه نزل صح

    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
      window.scrollTo({ top: 0, behavior: 'smooth' }); // رفع الشاشة لأعلى لرؤية الخطأ
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#FBF9F6] border border-gray-200 focus:border-brand-brown rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-brown/10 text-neo-text font-bold transition-all text-sm";
  const labelClass = "block text-gray-500 font-bold mb-2 text-xs";

  return (
    <>
      {/* ========================================== */}
      {/* 🖨 Rose ملصق الطباعة المخفي للباركود */}
      {/* ========================================== */}
      <div className="hidden print:flex print-receipt-only flex-col items-center justify-center bg-white text-black text-center">
        <div className="border border-black p-1 rounded-md inline-block w-[36mm] max-w-[36mm] overflow-hidden bg-white">
          <h2 className="font-black text-[11px] leading-none mb-0.5 tracking-wider uppercase">KARIZMA</h2>
          <p className="font-black text-[10px] leading-none mb-0.5 truncate w-full px-0.5">{printData?.name || 'اسم القطعة'}</p>
          
          {printData?.size && (
            <p className="font-black text-[10px] leading-none mb-0.5 text-gray-900">
              مقاس: {printData.size}
            </p>
          )}
          
          <div className="w-full flex justify-center items-center overflow-hidden my-0.5">
            <svg ref={barcodeSvgRef} className="w-[95%] h-[18px] object-contain"></svg>
          </div>
          
          <h3 className="font-black text-[12px] leading-none mt-0.5">{printData?.price ? `${printData?.price} ج.م` : ''}</h3>
        </div>
      </div>

      {/* ========================================== */}
      {/* 💻 واجهة الإضافة العادية */}
      {/* ========================================== */}
      <div className="max-w-5xl mx-auto animate-fade-in font-['Tajawal',sans-serif] pb-10 print:hidden">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/inventory" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <ArrowRight size={24} />
          </Link>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-neo-text">إضافة موديل جديد</h2>
            <p className="text-gray-500 text-sm mt-1 font-bold">أضف الموديل وقم بطباعة الباركود لكل مقاس ولون.</p>
          </div>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-2xl font-bold flex items-center gap-3 shadow-sm border ${message.isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
            {message.isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* القسم الأول: بيانات المنتج الأساسية */}
          <div className="bg-white shadow-soft p-6 md:p-8 rounded-[2rem] border border-gray-100">
            <h3 className="text-lg font-black text-neo-text border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-brand-brown rounded-full"></div>
              المعلومات الأساسية للموديل
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>اسم الموديل (تلقائي أو يدوي)</label>
                <input required type="text" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className={inputClass} placeholder="مثال: تيشيرت أوفر سايز صيفي" />
              </div>
              
              <div>
                <label className={labelClass}>القسم</label>
                <select required value={product.category} onChange={e => setProduct({...product, category: e.target.value})} className={inputClass}>
                  <option value="تيشرتات">تيشرتات</option>
                  <option value="هوديز">هوديز</option>
                  <option value="بناطيل">بناطيل</option>
                  <option value="شورتات">شورتات</option>
                  <option value="جواكت">جواكت</option>
                  <option value="أحذية">أحذية</option>
                  <option value="إكسسوارات">إكسسوارات</option>
                </select>
              </div>
              
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div>
                  <label className={labelClass}>سعر الشراء / التكلفة (ج.م)</label>
                  <input required type="number" step="0.01" value={product.base_price} onChange={e => setProduct({...product, base_price: e.target.value})} className={inputClass} placeholder="أدخل تكلفة القطعة هنا..." />
                </div>
                
                <div>
                  <label className={labelClass}>نسبة الزيادة / الربح (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="number" min="0" step="1" value={markupPercentage} onChange={e => setMarkupPercentage(e.target.value)} className={`${inputClass} pl-10`} placeholder="50" />
                  </div>
                </div>
              </div>

              {product.base_price && (
                <div className="md:col-span-3 mt-1 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
                  <span className="text-emerald-700 font-bold text-sm">
                    سعر البيع المقترح للزبون (بعد زيادة {markupPercentage}% وتقريب الكسور):
                  </span>
                  <span className="text-emerald-700 font-black text-2xl bg-white px-4 py-1 rounded-lg border border-emerald-100 shadow-sm">
                    {finalSellingPrice} ج.م
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* القسم الثاني: المتغيرات (المقاسات والألوان) */}
          <div className="bg-white shadow-soft p-6 md:p-8 rounded-[2rem] border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-black text-neo-text flex items-center gap-2">
                <div className="w-2 h-6 bg-brand-brown rounded-full"></div>
                المقاسات والألوان المتوفرة
              </h3>
              <button type="button" onClick={addVariantRow} className="flex items-center gap-2 text-sm bg-[#FBF9F6] text-brand-brown border border-brand-brown/20 px-4 py-2 rounded-xl font-bold hover:bg-brand-brown hover:text-white transition-colors shadow-sm">
                <Plus size={18} /> إضافة مقاس/لون آخر
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="relative grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-[#FBF9F6] p-5 rounded-2xl border border-gray-100 group">
                  
                  {variants.length > 1 && (
                    <button 
                      type="button" onClick={() => removeVariantRow(index)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-500 hover:text-white"
                    >
                      ×
                    </button>
                  )}

                  <div>
                    <label className={labelClass}>المقاس</label>
                    <input required type="text" value={variant.size} onChange={e => updateVariant(index, 'size', e.target.value)} className={inputClass} placeholder="M, L, XL..." />
                  </div>
                  
                  <div>
                    <label className={labelClass}>اللون (اختر أو اكتب)</label>
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 focus-within:border-brand-brown px-2 py-1 transition-all h-[46px]">
                      <input 
                        type="color" value={variant.color} onChange={e => updateVariant(index, 'color', e.target.value)} 
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0" title="اختر من لوحة الألوان"
                      />
                      <input 
                        type="text" value={variant.colorName} onChange={e => updateVariant(index, 'colorName', e.target.value)} 
                        className="w-full bg-transparent outline-none text-neo-text font-bold text-sm placeholder:text-gray-300" 
                        placeholder="اسم اللون (أسود)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>الكمية</label>
                    <input required type="number" min="0" value={variant.stock_quantity} onChange={e => updateVariant(index, 'stock_quantity', e.target.value)} className={inputClass} placeholder="العدد" />
                  </div>
                  
                  <div>
                    <label className={labelClass}>الكود والطباعة</label>
                    <div className="flex gap-2 relative">
                      <div className="relative flex-grow">
                        <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          required type="text" value={variant.sku} onChange={e => updateVariant(index, 'sku', e.target.value)} 
                          className={`${inputClass} pr-9 font-black text-brand-brown`} 
                          placeholder={fetchingCode ? 'جاري التحميل...' : '100'} 
                        />
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => handlePrintVariant(variant)}
                        className="flex-shrink-0 w-[46px] h-[46px] bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors border border-blue-100"
                        title="طباعة باركود هذا الصنف"
                      >
                        <Printer size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || fetchingCode} className="w-full py-4 rounded-2xl font-black text-lg text-white bg-neo-text shadow-xl hover:bg-black hover:-translate-y-1 transition-all disabled:opacity-70 flex justify-center items-center gap-3">
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            {loading ? 'جاري تسجيل الموديل...' : 'حفظ الموديل في المخزن'}
          </button>
          
        </form>
      </div>
    </>
  );
};