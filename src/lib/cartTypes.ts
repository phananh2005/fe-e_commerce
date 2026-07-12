export interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  productStatus?: string;
  currentVariantId?: string | number;
  variantSkuCode?: string;
  variantImageUrl?: string;
  variantPrice: number;
  stockQuantity: number;
  cartItemQuantity: number;
  shopId?: number; // optional shop/seller id
  shopName?: string; // optional shop name
  color?: string;
  storage?: string;
}

export interface ShopGroup {
  shopId?: number;
  shopName: string;
  items: CartItem[];
}

export interface OrderSummary {
  itemsTotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  totalQuantity: number;
}
