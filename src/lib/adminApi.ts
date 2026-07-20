import { authRequest, requestJson as publicRequest } from "./api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
}

export interface PageResult<T> {
  content: T[];
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
}

export interface DashboardOverview {
  totalUsers: number;
  totalProducts: number;
}

export interface OrderStatusStatistic {
  status: string;
  count: number;
}

export interface OrderStatistics {
  fromDate: string;
  toDate: string;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  totalRevenue: number;
  statusStatistics: OrderStatusStatistic[];
}

export interface RevenueItem {
  period: string;
  orders: number;
  paidOrders: number;
  revenue: number;
}

export interface RevenueReport {
  groupBy: string;
  fromDate: string;
  toDate: string;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  items: RevenueItem[];
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  roles: string[];
  isEnabled: boolean;
  createdAt?: string;
  createdBy?: string | null;
  modifiedAt?: string;
  modifiedBy?: string | null;
}

export interface StaffCustomerInfo {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  roles: string[];
  isEnabled: boolean;
}

export interface AdminProduct {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  status: string;
  categoryName: number | string | null;
  brandName: number | string | null;
  createdAt?: string;
  modifiedAt?: string;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export interface Brand {
  brandId: number;
  brandName: string;
  brandDescription: string | null;
  brandImage: string | null;
  isEnabled: boolean;
  createdAt?: string;
  modifiedAt?: string;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  categoryDescription: string | null;
  imageUrl: string | null;
  isEnabled: boolean;
  createdAt?: string;
  modifiedAt?: string;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export interface StaffOrderItem {
  productId: number;
  productName: string;
  skuCode: string;
  quantity: number;
  price: number;
  variantImageUrl?: string;
}

export interface StaffOrder {
  orderId: number;
  userId: number;
  totalPrice: number;
  createdAt?: string;
  
  // Fields present in detail but removed in search
  fullName?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  shippingFee?: number;
  status?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentDate?: string | null;
  modifiedAt?: string;
  createdBy?: string | null;
  modifiedBy?: string | null;
  
  // Fields added in V1.0.3
  cancellationReason?: string;
  username?: string;
  items?: StaffOrderItem[];
}

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type OrderStatus =
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type UserStatus = "active" | "inactive";

function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  if (token) {
    return authRequest<T>(path, token, { method, body });
  }
  return publicRequest<T>(path, { method, body });
}

function buildQuery(
  params: Record<
    string,
    string | number | boolean | Array<string | number> | undefined
  >,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function getDashboardOverview(token: string) {
  return requestJson<DashboardOverview>("/management/statistics/overview", {
    token,
  });
}

export function getOrderStatistics(
  token: string,
  body: { fromDate: string; toDate: string },
) {
  return requestJson<OrderStatistics>("/management/statistics/orders", {
    method: "POST",
    token,
    body,
  });
}

export function getRevenueReport(
  token: string,
  body: {
    fromDate: string;
    toDate: string;
    groupBy?: "DAY" | "MONTH" | "QUARTER" | "YEAR";
  },
) {
  return requestJson<RevenueReport>("/management/statistics/revenue", {
    method: "POST",
    token,
    body,
  });
}

export function createBrand(
  token: string,
  body: { name: string; description?: string; imageUrl?: string },
) {
  return requestJson<void>("/management/brands", {
    method: "POST",
    token,
    body,
  });
}

export function updateBrand(
  token: string,
  body: {
    brandId: number;
    name: string;
    description?: string;
    imageUrl?: string | null;
  },
) {
  return requestJson<void>("/management/brands/update", {
    method: "PATCH",
    token,
    body,
  });
}

export function updateBrandStatus(
  token: string,
  brandId: number,
  status: string,
) {
  return requestJson<void>(`/management/brands/${brandId}/${status}`, {
    method: "PATCH",
    token,
  });
}

export function createCategory(
  token: string,
  body: {
    categoryName: string;
    categoryDescription?: string;
    imageUrl?: string;
  },
) {
  return requestJson<void>("/management/categories", {
    method: "POST",
    token,
    body,
  });
}

export function updateCategory(
  token: string,
  body: {
    categoryId: number;
    categoryName?: string;
    categoryDescription?: string;
    imageUrl?: string | null;
  },
) {
  return requestJson<void>("/management/categories", {
    method: "PUT",
    token,
    body,
  });
}

export function updateCategoryStatus(
  token: string,
  categoryId: number,
  status: string,
) {
  return requestJson<void>(`/management/categories/${categoryId}/${status}`, {
    method: "PATCH",
    token,
  });
}

export function createProduct(
  token: string,
  body: {
    name?: string;
    description?: string;
    categoryId?: number;
    brandId?: number;
    productAvatarUrl?: string;
    variants?: Array<{
      skuCode: string;
      price: number;
      stockQuantity: number;
      attributes?: Record<string, string>;
      variantAvatarUrl?: string;
      variantImageUrls?: string[];
    }>;
  },
) {
  return requestJson<void>("/management/product/create", {
    method: "POST",
    token,
    body,
  });
}

export function updateProduct(
  token: string,
  body: {
    productId: number;
    name?: string;
    description?: string;
    categoryId?: number;
    brandId?: number;
    productAvatarUrl?: string | null;
  },
) {
  return requestJson<void>("/management/product/update", {
    method: "PUT",
    token,
    body,
  });
}

export function updateProductStatus(
  token: string,
  productId: number,
  status: ProductStatus,
) {
  return requestJson<void>(`/management/product/${productId}/${status}`, {
    method: "PATCH",
    token,
  });
}

export function updateUserRole(
  token: string,
  body: { userId: number; roleNames: string[] },
) {
  return requestJson<void>("/management/users/update-role", {
    method: "PATCH",
    token,
    body,
  });
}

export function createUser(
  token: string,
  body: {
    username: string;
    password?: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    roles?: string[];
    roleName?: string;
  },
) {
  // API expects `roleName` (string), not `roles` (array).
  // Transform for backward compat with callers that pass `roles`.
  const { roles, ...rest } = body;
  const payload = {
    ...rest,
    roleName: body.roleName ?? roles?.[0] ?? "ROLE_CUSTOMER",
  };
  return requestJson<void>("/management/users", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateUserStatus(
  token: string,
  userId: number,
  status: UserStatus,
) {
  return requestJson<void>(`/management/users/${userId}/${status}`, {
    method: "PATCH",
    token,
  });
}

export function updateOrderStatus(
  token: string,
  orderId: number,
  status: OrderStatus,
  cancellationReason?: string,
) {
  return requestJson<StaffOrder>(`/management/order/${orderId}`, {
    method: "PATCH",
    token,
    body: { status, cancellationReason },
  });
}

export function searchUsers(
  token: string,
  params: {
    keyword?: string;
    enabled?: boolean | null;
    roleNames?: string[];
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
) {
  return requestJson<PageResult<AdminUser>>(
    `/management/users${buildQuery({
      keyword: params.keyword,
      enabled: params.enabled ?? undefined,
      roleNames: params.roleNames,
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortType: params.sortType,
    })}`,
    { token },
  );
}

export function getStaffCustomerInfo(token: string, id: number) {
  return requestJson<StaffCustomerInfo>(`/management/users/info/${id}`, {
    token,
  });
}

export function searchProducts(
  token: string,
  params: {
    keyword?: string;
    categoryId?: number | null;
    brandId?: number | null;
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
) {
  return requestJson<PageResult<AdminProduct>>(
    `/management/product/search${buildQuery({
      keyword: params.keyword,
      categoryId: params.categoryId ?? undefined,
      brandId: params.brandId ?? undefined,
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortType: params.sortType,
    })}`,
    { token },
  );
}

export function searchBrands(
  token: string,
  params: {
    keyword?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
) {
  return requestJson<PageResult<Brand>>(
    `/management/brands/search${buildQuery({
      keyword: params.keyword,
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortType: params.sortType,
    })}`,
    { token },
  );
}

export function searchCategories(
  token: string,
  params: {
    keyword?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
) {
  return requestJson<PageResult<Category>>(
    `/management/categories/search${buildQuery({
      keyword: params.keyword,
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortType: params.sortType,
    })}`,
    { token },
  );
}

export function searchOrders(
  token: string,
  params: {
    orderCode?: string;
    status?: string;
    createdFromDate?: string;
    createdToDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
) {
  return requestJson<PageResult<StaffOrder>>(
    `/management/order/search${buildQuery({
      orderCode: params.orderCode,
      status: params.status,
      createdFromDate: params.createdFromDate,
      createdToDate: params.createdToDate,
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortType: params.sortType,
    })}`,
    { token },
  );
}

export function getOrderDetail(token: string, orderId: number) {
  return requestJson<StaffOrder>(`/management/order/${orderId}`, { token });
}

export interface AdminVariant {
  id: number;
  skuCode: string;
  price: number;
  stockQuantity: number;
  attributes?: Array<{
    attributeId?: number;
    attributeName: string;
    attributeValue: string;
  }>;
  variantImageUrl?: Array<{
    imageId: number;
    imageUrl: string;
    isAvatar: boolean;
  }>;
}

export function getProductVariants(token: string, productId: number) {
  return requestJson<AdminVariant[]>(
    `/management/product/${productId}/variants`,
    { token },
  );
}

export function addProductVariant(
  token: string,
  productId: number,
  body: {
    skuCode: string;
    price: number;
    stockQuantity: number;
    attributes?: Record<string, string>;
    variantAvatarUrl?: string;
    variantImageUrls?: string[];
  },
) {
  return requestJson<void>(
    `/management/product/${productId}/variants`,
    { method: "POST", token, body },
  );
}

export function updateVariantStock(
  token: string,
  variantId: number,
  stockQuantity: number,
) {
  return requestJson<void>(
    `/management/product/variant/${variantId}/${stockQuantity}`,
    { method: "PATCH", token },
  );
}

export interface RoleOption {
  id: number;
  roleName: string;
}

export function getRoleOptions(token: string) {
  return requestJson<RoleOption[]>("/management/users/roles", { token });
}
