import { API_BASE_URL } from "./api";

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

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
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

export interface StaffOrder {
  orderId: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  shippingFee: number;
  totalPrice: number;
  status: string;
  isPaid: boolean;
  paymentMethod: string;
  paymentDate: string | null;
  createdAt?: string;
  modifiedAt?: string;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type OrderStatus =
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type UserStatus = "active" | "inactive";

async function requestJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();
  const parsedBody = rawBody ? (JSON.parse(rawBody) as ApiResponse<T>) : null;

  if (!response.ok) {
    const message = parsedBody?.message || rawBody || "Request failed";
    throw new Error(message);
  }

  if (!parsedBody || parsedBody.code !== 1000) {
    const message = parsedBody?.message || "Request failed";
    throw new Error(message);
  }

  return parsedBody.result;
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
  return requestJson<DashboardOverview>("/admin/statistics/overview", {
    token,
  });
}

export function getOrderStatistics(
  token: string,
  body: { fromDate: string; toDate: string },
) {
  return requestJson<OrderStatistics>("/admin/statistics/orders", {
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
  return requestJson<RevenueReport>("/admin/statistics/revenue", {
    method: "POST",
    token,
    body,
  });
}

export function createBrand(
  token: string,
  body: { name: string; description?: string; imageUrl?: string },
) {
  return requestJson<void>("/admin/brands", {
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
  return requestJson<void>("/admin/brands/update", {
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
  return requestJson<void>(`/admin/brands/${brandId}/${status}`, {
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
  return requestJson<void>("/admin/categories", {
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
  return requestJson<void>("/admin/categories", {
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
  return requestJson<void>(`/admin/categories/${categoryId}/${status}`, {
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
  return requestJson<void>("/admin/users/update-role", {
    method: "PATCH",
    token,
    body,
  });
}

export function updateUserStatus(
  token: string,
  userId: number,
  status: UserStatus,
) {
  return requestJson<void>(`/admin/users/${userId}/${status}`, {
    method: "PATCH",
    token,
  });
}

export function updateOrderStatus(
  token: string,
  orderId: number,
  status: OrderStatus,
) {
  return requestJson<void>(`/management/${orderId}/${status}`, {
    method: "PATCH",
    token,
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
    `/admin/users${buildQuery({
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
  return requestJson<StaffCustomerInfo>(`/staff/users/customer/info/${id}`, {
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
    `/admin/brands/search${buildQuery({
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
    `/admin/categories/search${buildQuery({
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
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
) {
  return requestJson<PageResult<StaffOrder>>(
    `/management/search${buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortType: params.sortType,
    })}`,
    { token },
  );
}
