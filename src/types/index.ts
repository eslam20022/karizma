export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock_int: number;
  main_stock?: number;
  category: string | null;
  cost_price?: number; // 💰 الإضافة الجديدة للتكلفة
  size?: string;  // 👕 الإضافة: المقاس
  color?: string; // 🎨 الإضافة: اللون
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  invoice_no?: number; // تم إضافتها لتطابق قاعدة البيانات
  total_amount: number;
  items: CartItem[];
  is_closed?: boolean; // تم إضافتها لمعرفة حالة الفاتورة
  created_at: string;
}