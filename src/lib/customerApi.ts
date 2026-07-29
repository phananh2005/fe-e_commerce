import { API_BASE_URL, authRequest, requestJson } from "./api";

async function safeJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed || parsed.code !== 1000) return null;
    return parsed.result as T;
  } catch {
    return null;
  }
}

export interface CategoryItem {
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
}

export interface BrandItem {
  brandId: number;
  brandName: string;
  brandImage?: string;
}

export interface ProductShort {
  productId: number;
  productUuid: string;
  productName: string;
  minPrice?: number;
  avatarUrl?: string;
}

export async function getCategories(): Promise<CategoryItem[]> {
  const r = await safeJson<CategoryItem[]>("/categories");
  return r ?? [];
}

export async function getBrands(): Promise<BrandItem[]> {
  const r = await safeJson<BrandItem[]>("/brands");
  return r ?? [];
}

export interface SearchProductsParams {
  keyword?: string;
  categoryId?: number | string;
  brandId?: number | string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortType?: "asc" | "desc";
}

export async function searchProducts(
  params: SearchProductsParams = {},
): Promise<ProductShort[]> {
  const { content } = await searchProductsPage(params);
  return content;
}

export async function searchProductsPage(
  params: SearchProductsParams = {},
): Promise<{ content: ProductShort[]; totalElements: number; totalPages: number }> {
  const search = new URLSearchParams();
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.categoryId) search.set("categoryId", String(params.categoryId));
  if (params.brandId) search.set("brandId", String(params.brandId));
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 20));
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortType) search.set("sortType", params.sortType);

  const r = await safeJson<{
    content: ProductShort[];
    totalElements: number;
    totalPages: number;
  }>(`/search?${search.toString()}`);

  return {
    content: r?.content ?? [],
    totalElements: r?.totalElements ?? 0,
    totalPages: r?.totalPages ?? 0,
  };
}

export interface VariantAttribute {
  attributeId?: number;
  attributeName: string;
  attributeValue: string;
}

export interface VariantImage {
  imageId: number;
  imageUrl: string;
  isAvatar: boolean;
}

export interface ProductVariant {
  variantUuid: string;
  variantSkuCode: string;
  variantPrice: number;
  stockQuantity: number;
  attributes?: VariantAttribute[];
  variantImageUrl?: VariantImage[];
}

export interface ProductDetail {
  productId: number;
  productUuid: string;
  productName: string;
  productDescription?: string;
  avatarUrl?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  variants?: ProductVariant[];
}

export async function getProduct(id: number | string): Promise<ProductDetail | null> {
  return await safeJson<ProductDetail>(`/product/${id}`);
}

export interface CartApiItem {
  cartItemId?: number;
  productUuid?: string;
  productName?: string;
  currentVariantUuid?: string;
  variantSkuCode?: string;
  variantImageUrl?: string;
  variantPrice?: number;
  stockQuantity?: number;
  cartItemQuantity?: number;
  quantity?: number;
}

export async function getCartItems(
  token?: string,
): Promise<CartApiItem[] | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/cart-item/my-cart`, { headers });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed || parsed.code !== 1000) return null;
    return parsed.result ?? null;
  } catch {
    return null;
  }
}

export async function getSearchSuggestions(keyword: string): Promise<string[]> {
  if (!keyword) return [];
  const results = await searchProducts({ keyword, page: 0, size: 6 });
  return results.map((p) => p.productName ?? "").filter(Boolean);
}

// Cart mutations
export async function addToCart(
  token: string,
  variantUuid: string,
  quantity: number,
) {
  try {
    await authRequest("/cart-item/add", token, {
      method: "POST",
      body: { variantUuid, quantity },
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateCartItem(
  token: string,
  cartItemUuid: string,
  variantUuid: string,
  quantity: number,
) {
  try {
    await authRequest("/cart-item/update", token, {
      method: "PATCH",
      body: { cartItemUuid, variantUuid, quantity },
    });
    return true;
  } catch {
    return false;
  }
}

export async function removeCartItems(token: string, uuids: string[]) {
  try {
    const idStr = uuids.join(",");
    await authRequest(`/cart-item/remove/${idStr}`, token, {
      method: "DELETE",
    });
    return true;
  } catch {
    return false;
  }
}

// Order preview and checkout
export async function previewOrder(
  token: string,
  items: Array<{ variantUuid: string; quantity: number }>,
) {
  try {
    // docs mention GET with body; use POST for reliability
    const res = await fetch(`${API_BASE_URL}/orders/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(items),
    });
    
    const text = await res.text();
    if (!text) throw new Error("Empty response from server");
    
    const parsed = JSON.parse(text);
    if (!res.ok || parsed.code !== 1000) {
       throw new Error(parsed.message || "Failed to preview order");
    }
    return parsed.result;
  } catch (error) {
    console.error("Preview order error:", error);
    throw error;
  }
}

export interface CheckoutPayload {
  fullName: string;
  phoneNumber: string;
  paymentMethod: string;
  shippingAddress: string;
  shippingFee: number;
  items: Array<{ variantUuid: string; quantity: number }>;
}

/** Place an order. Backend returns 204 No Content on success. */
export async function checkout(token: string, payload: CheckoutPayload) {
  await authRequest<void>("/orders/checkout", token, {
    method: "POST",
    body: payload,
  });
  return true;
}

export interface OrderItem {
  productId: number;
  productUuid?: string;
  productName: string;
  skuCode: string;
  quantity: number;
  price: number;
  variantImageUrl?: string;
}

export interface OrderSummaryResponse {
  orderUuid: string;
  orderCode?: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: Array<{
    productUuid: string;
    variantUuid: string;
    productName: string;
    variantImageUrl?: string;
    price: number;
    quantity: number;
  }>;
}

export interface OrderDetailResponse {
  orderUuid: string;
  orderCode?: string;
  addressInfo?: { fullName: string; phoneNumber: string; shippingAddress: string };
  isPaid?: boolean;
  paymentDate?: string | null;
  modifiedAt?: string;
  userId?: number;
  userUuid?: string;
  status: string;
  totalPrice: number;
  shippingFee: number;
  discount: number;
  shippingAddress: string;
  phoneNumber: string;
  paymentMethod: string;
  cancellationReason?: string;
  createdAt: string;
  items: Array<{
    productUuid: string;
    variantUuid: string;
    productName: string;
    skuCode?: string;
    variantImageUrl?: string;
    price: number;
    quantity: number;
  }>;
}

export async function getMyOrders(
  token: string,
): Promise<OrderSummaryResponse[]> {
  const result = await authRequest<OrderSummaryResponse[] | null>(
    "/orders/my-orders",
    token,
  );
  return result ?? [];
}

export function getOrderDetail(token: string, orderUuid: string) {
  return requestJson<OrderDetailResponse>(`/orders/${orderUuid}`, {
    token,
  });
}

export interface UserProfile {
  uuid: string;
  username: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  roles: string[];
  isEnabled: boolean;
}

export async function getMyInfo(token: string): Promise<UserProfile> {
  return authRequest<UserProfile>("/users/my-info", token);
}

export async function updateMyInfo(
  token: string,
  body: {
    fullName: string;
    phoneNumber: string;
    address?: string;
    email?: string;
  },
) {
  await authRequest<void>("/users/update-info", token, {
    method: "PATCH",
    body,
  });
  return true;
}

export async function changePassword(
  token: string,
  body: { oldPassword: string; newPassword: string },
) {
  await authRequest<void>("/users/change-password", token, {
    method: "PATCH",
    body,
  });
  return true;
}

// Silence unused-import warning when only fetch-based helpers are used above.
void requestJson;
