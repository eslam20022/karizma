export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string;
  created_at: string;
  is_preorder?: boolean; // أضفناها لدعم حجز المنتجات المنتهية
}

// نوع مجمع يمثل المنتج مع متغيراته (يفيدنا جداً في صفحة تفاصيل المنتج)
export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}