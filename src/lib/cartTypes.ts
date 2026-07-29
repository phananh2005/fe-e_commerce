export interface CartItem {
  cartItemUuid: string;
  productUuid: string;
  productName: string;
  productStatus?: string;
  currentVariantUuid?: string;
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
