# Frontend Development Guide — E-commerce DDD

> Tài liệu đầy đủ cho team/cá nhân phát triển Frontend kết nối với Backend DDD này.

---

## Mục lục

1. [Cấu hình & Kết nối](#1-cấu-hình--kết-nối)
2. [Wrapper Response & Error Codes](#2-wrapper-response--error-codes)
3. [Authentication Flow](#3-authentication-flow)
4. [Cloudinary Upload Flow](#4-cloudinary-upload-flow)
5. [API Reference — Auth](#5-api-reference--auth)
6. [API Reference — User Management](#6-api-reference--user-management)
7. [API Reference — Product Catalog (Brand & Category)](#7-api-reference--product-catalog-brand--category)
8. [API Reference — Product & Variant](#8-api-reference--product--variant)
9. [API Reference — Cart](#9-api-reference--cart)
10. [API Reference — Order](#10-api-reference--order)
11. [API Reference — Dashboard (Admin)](#11-api-reference--dashboard-admin)
12. [Role & Permission Matrix](#12-role--permission-matrix)
13. [Mapping Màn hình → API](#13-mapping-màn-hình--api)
14. [Workflow điển hình](#14-workflow-điển-hình)
15. [Lưu ý triển khai](#15-lưu-ý-triển-khai)

---

## 1. Cấu hình & Kết nối

| Item | Giá trị |
|------|---------|
| **Base URL** | `http://localhost:8080/e-commerce` |
| **Swagger UI** | `http://localhost:8080/e-commerce/swagger-ui.html` |
| **OpenAPI JSON** | `http://localhost:8080/e-commerce/v3/api-docs` |
| **Content-Type** | `application/json` (trừ upload file) |

### CORS
Backend cấu hình CORS cho FE dev server. Nếu gặp lỗi CORS, kiểm tra `WebConfig.java` hoặc `application.properties`.

---

## 2. Wrapper Response & Error Codes

### Response bọc chuẩn

```json
{
  "code": 1000,
  "message": "...",
  "result": {}
}
```

- `code = 1000` → thành công.
- `result = null` → không có dữ liệu trả về (204 No Content).

### Lỗi Validation (HTTP 400)

```json
{
  "code": 400,
  "message": "Validation failed",
  "result": {
    "username": "Username is required",
    "email": "Email is invalid"
  }
}
```

### Bảng mã lỗi

| Code | HTTP | Tên lỗi | Mô tả |
|------|------|---------|-------|
| 400 | 400 | `INVALID_REQUEST` | Request không hợp lệ |
| 400 | 400 | `VALIDATION_ERROR` | Lỗi validation field |
| 400 | 400 | `OLD_PASSWORD_INCORRECT` | Mật khẩu cũ không đúng |
| 400 | 400 | `INVALID_QUANTITY` | Số lượng không hợp lệ |
| 400 | 400 | `INSUFFICIENT_STOCK` | Không đủ tồn kho |
| 401 | 401 | `UNAUTHORIZED` | Chưa xác thực |
| 401 | 401 | `INVALID_USERNAME_OR_PASSWORD` | Sai username hoặc password |
| 401 | 401 | `TOKEN_EXPIRED` | Access token hết hạn → cần refresh |
| 401 | 401 | `INVALID_TOKEN` | Token không hợp lệ hoặc đã bị vô hiệu hóa |
| 401 | 401 | `REFRESH_TOKEN_EXPIRED` | Refresh token hết hạn → đăng nhập lại |
| 403 | 403 | `FORBIDDEN` | Không có quyền truy cập |
| 403 | 403 | `ACCOUNT_DISABLED` | Tài khoản bị vô hiệu hóa |
| 404 | 404 | `NOT_FOUND` | Không tìm thấy tài nguyên |
| 404 | 404 | `USER_NOT_FOUND` | Không tìm thấy user |
| 404 | 404 | `PRODUCT_NOT_FOUND` | Không tìm thấy sản phẩm |
| 404 | 404 | `PRODUCT_VARIANT_NOT_FOUND` | Không tìm thấy biến thể |
| 404 | 404 | `ATTRIBUTE_NOT_FOUND` | Không tìm thấy thuộc tính |
| 404 | 404 | `CATEGORY_NOT_FOUND` | Không tìm thấy danh mục |
| 404 | 404 | `BRAND_NOT_FOUND` | Không tìm thấy thương hiệu |
| 404 | 404 | `ORDER_NOT_FOUND` | Không tìm thấy đơn hàng |
| 404 | 404 | `ORDER_ITEM_NOT_FOUND` | Không tìm thấy item đơn hàng |
| 404 | 404 | `CART_ITEM_NOT_FOUND` | Không tìm thấy item giỏ hàng |
| 409 | 409 | `CONFLICT` | Xung đột dữ liệu |
| 409 | 409 | `CONCURRENT_UPDATE_ERROR` | Xung đột cập nhật |
| 409 | 409 | `USER_ALREADY_EXISTS` | User đã tồn tại |
| 409 | 409 | `USERNAME_ALREADY_EXISTS` | Username đã tồn tại |
| 409 | 409 | `EMAIL_ALREADY_EXISTS` | Email đã tồn tại |
| 500 | 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
| 500 | 500 | `FILE_DELETE_ERROR` | Lỗi xóa file |
| 500 | 500 | `TOKEN_GENERATION_ERROR` | Lỗi tạo token |
| 500 | 500 | `TOKEN_SIGNING_ERROR` | Lỗi ký token |
| 500 | 500 | `ROLE_READ_ERROR` | Lỗi đọc thông tin role |

---

## 3. Authentication Flow

### Đăng ký / Đăng nhập

```
POST /auth/register  →  204 No Content
POST /auth/login     →  { accessToken, refreshToken }
```

Lưu token:
```
accessToken  → sessionStorage (hoặc memory, mất khi tắt tab)
refreshToken → localStorage  (hoặc httpOnly cookie — khuyến nghị)
```

Gắn header mọi request cần auth:
```
Authorization: Bearer <accessToken>
```

### Refresh Token

```
POST /auth/refresh  { "refreshToken": "..." }
→ Cặp token mới, lưu lại cả hai
```

Xử lý khi nhận 401 `TOKEN_EXPIRED`:
1. Gọi `/auth/refresh` với `refreshToken` hiện tại.
2. Thành công → lưu token mới, **retry request gốc**.
3. Thất bại `REFRESH_TOKEN_EXPIRED` → redirect trang đăng nhập.

### Logout

```
POST /auth/logout  { "token": "<accessToken>" }
→ Xóa token khỏi storage → redirect login
```

### Kiểm tra token (Introspect)

```
POST /auth/introspect  { "token": "..." }
→ { active: true, username: "...", expiresAt: ... }
```

Dùng khi khởi tạo app để xác nhận session còn hợp lệ.

---

## 4. Cloudinary Upload Flow

> Backend **không nhận file trực tiếp**. Frontend upload lên Cloudinary, lấy URL rồi gửi vào backend.

```
1. Gọi GET /cloudinary/signature?folder=products
   → { signature, timestamp, cloudName, apiKey, folder }

2. POST trực tiếp lên Cloudinary:
   POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
   Content-Type: multipart/form-data
   Body:
     file      = <File object>
     api_key   = <apiKey>
     timestamp = <timestamp>
     signature = <signature>
     folder    = <folder>

3. Cloudinary trả về { secure_url, public_id, ... }
   → Lấy secure_url gửi vào backend (imageUrl, productAvatarUrl, ...)
```

**Frontend helper example (JavaScript):**
```javascript
async function uploadImage(file, folder = 'products') {
  // 1. Lấy signature từ backend
  const sigRes = await fetch(`/cloudinary/signature?folder=${folder}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { result: { signature, timestamp, cloudName, apiKey } } = await sigRes.json();

  // 2. Upload lên Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  const { secure_url } = await uploadRes.json();
  return secure_url; // URL gửi vào backend
}
```

---

## 5. API Reference — Auth

> Base path: `/auth` | Không yêu cầu auth (trừ logout).

### 5.1 Đăng ký

```
POST /auth/register
```

| Field | Type | Bắt buộc | Ghi chú |
|-------|------|----------|---------|
| `username` | string | ✅ | |
| `password` | string | ✅ | |
| `email` | string | ❌ | Đúng định dạng email nếu có |
| `address` | string | ❌ | |
| `fullName` | string | ✅ | |
| `phoneNumber` | string | ✅ | |

**Response:** 204 No Content

### 5.2 Đăng nhập

```
POST /auth/login
```

| Field | Type | Bắt buộc |
|-------|------|----------|
| `username` | string | ✅ |
| `password` | string | ✅ |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 5.3 Refresh Token

```
POST /auth/refresh
```

| Field | Type | Bắt buộc |
|-------|------|----------|
| `refreshToken` | string | ✅ |

**Response 200:** _(cặp token mới)_

### 5.4 Logout

```
POST /auth/logout
```

| Field | Type | Bắt buộc | Ghi chú |
|-------|------|----------|---------|
| `token` | string | ✅ | Truyền `accessToken` hiện tại |

**Response 200:**
```json
{ "code": 1000, "message": "Logout successful", "result": { "success": true } }
```

### 5.5 Introspect

```
POST /auth/introspect
```

| Field | Type | Bắt buộc |
|-------|------|----------|
| `token` | string | ✅ |

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "active": true,
    "username": "john_doe",
    "tokenType": "Bearer",
    "expiresAt": 1719820800
  }
}
```

---

## 6. API Reference — User Management

### 6.1 Customer — Tài khoản cá nhân

> Yêu cầu: Bearer token.

#### GET /users/my-info

```json
{
  "code": 1000,
  "result": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phoneNumber": "0901234567",
    "address": "123 Đường ABC, TP.HCM",
    "roles": ["ROLE_CUSTOMER"],
    "isEnabled": true
  }
}
```

#### PATCH /users/update-info

```json
{
  "fullName": "John Doe",
  "phoneNumber": "0901234567",
  "address": "123 Đường ABC",
  "email": "john@example.com"
}
```

| Field | Type | Bắt buộc |
|-------|------|----------|
| `fullName` | string | ✅ |
| `phoneNumber` | string | ✅ |
| `address` | string | ❌ |
| `email` | string | ❌ |

**Response:** 204 No Content

#### PATCH /users/change-password

```json
{
  "oldPassword": "...",
  "newPassword": "..."
}
```

**Response:** 204 No Content

---

### 6.2 Admin — Quản trị người dùng

> Yêu cầu: `ROLE_ADMIN`

#### POST /management/users

Tạo user bởi admin. Thay cho API cũ `registerAdminOrStaff` / `/register/{roleName}`.

```json
{
  "username": "staff01",
  "password": "password123",
  "email": "staff@example.com",
  "address": "123 Đường ABC",
  "fullName": "Staff User",
  "phoneNumber": "0901234567",
  "roleName": "ROLE_DELIVERY_STAFF"
}
```

| Field | Type | Bắt buộc | Ghi chú |
|-------|------|----------|---------|
| `username` | string | ✅ | |
| `password` | string | ✅ | |
| `email` | string | ❌ | Đúng định dạng email nếu có |
| `address` | string | ❌ | |
| `fullName` | string | ✅ | |
| `phoneNumber` | string | ✅ | |
| `roleName` | RoleName | ✅ | `ROLE_CUSTOMER`, `ROLE_DELIVERY_STAFF`, `ROLE_ADMIN` |

**Response:** 204 No Content

#### GET /management/users

**Query Parameters:**

| Param | Type | Mặc định | Ghi chú |
|-------|------|----------|---------|
| `keyword` | string | | Tìm username/email/fullName |
| `roleNames` | RoleName[] | | `ROLE_CUSTOMER`, `ROLE_DELIVERY_STAFF`, `ROLE_ADMIN` |
| `enabled` | boolean | | true/false |
| `page` | int | 0 | |
| `size` | int | 10 | |
| `sortBy` | string | createdAt | |
| `sortType` | string | desc | |

**Response 200:** Phân trang, cấu trúc `content[]` chứa User objects.

#### GET /management/users/info/{id}

**Response 200:** User object.

#### PATCH /management/users/update-role

```json
{
  "userId": 5,
  "roleNames": ["ROLE_DELIVERY_STAFF"]
}
```

#### PATCH /management/users/{id}/{status}

| Param | Mô tả |
|-------|-------|
| `id` | ID người dùng |
| `status` | `active` hoặc `inactive` |

**Response:** 204 No Content

---

## 7. API Reference — Product Catalog (Brand & Category)

### 7.1 Customer — Danh sách Brand/Category

```
GET /brands      → result: Brand[]
GET /categories  → result: Category[]
```

Không cần auth. Không query param.

**Brand/Category object:**
```json
{
  "brandId": 1,
  "brandName": "Nike",
  "brandDescription": "Just Do It",
  "brandImage": "https://res.cloudinary.com/.../nike.jpg",
  "isEnabled": true,
  "createdAt": "2024-01-01T08:00:00",
  "modifiedAt": "2024-06-01T10:00:00",
  "createdBy": "admin",
  "modifiedBy": "admin"
}
```

---

### 7.2 Admin — Quản lý Brand

> Yêu cầu: `ROLE_ADMIN`

#### GET /management/brands/search

**Query Parameters:**

| Param | Type | Ghi chú |
|-------|------|---------|
| `keyword` | string | Tìm theo tên |
| `page` | int | Mặc định 0 |
| `size` | int | Mặc định 10 |
| `sortBy` | string | `createdAt`, `brandName` |
| `sortType` | string | `asc` / `desc` |

**Response:** Phân trang Brand[]

#### POST /management/brands

```json
{
  "name": "Nike",
  "description": "Just Do It",
  "imageUrl": "https://res.cloudinary.com/.../nike.jpg"
}
```

#### PATCH /management/brands/update

```json
{
  "brandId": 1,
  "name": "Nike Updated",
  "description": "Mô tả mới",
  "imageUrl": "https://res.cloudinary.com/.../nike-new.jpg"
}
```

> `imageUrl = null` giữ ảnh cũ · `imageUrl = ""` xóa ảnh.

#### PATCH /management/brands/{brandId}/{status}

**Response:** 204 No Content

---

### 7.3 Admin — Quản lý Category

> Yêu cầu: `ROLE_ADMIN`

#### GET /management/categories/search

_(Query params giống 7.2)_

#### POST /management/categories

```json
{
  "categoryName": "Giày thể thao",
  "categoryDescription": "Các loại giày thể thao",
  "imageUrl": "https://res.cloudinary.com/.../sneaker.jpg"
}
```

#### PUT /management/categories

```json
{
  "categoryId": 1,
  "categoryName": "Giày thể thao updated",
  "categoryDescription": "Mô tả mới",
  "imageUrl": "https://res.cloudinary.com/.../sneaker-new.jpg"
}
```

#### PATCH /management/categories/{categoryId}/{status}

**Response:** 204 No Content

---

## 8. API Reference — Product & Variant

### 8.1 Customer — Tìm kiếm sản phẩm

> Không cần auth. Chỉ trả sản phẩm `ACTIVE`.

```
GET /search
```

**Query Parameters:**

| Param | Type | Ghi chú |
|-------|------|---------|
| `keyword` | string | Tìm theo tên |
| `page` | int | Mặc định 0 |
| `size` | int | Mặc định 10 |
| `sortBy` | string | `minPrice`, `productName` |
| `sortType` | string | `asc` / `desc` |

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "content": [
      {
        "productId": 1,
        "productName": "Giày Nike Air Max",
        "minPrice": 1200000.00,
        "avatarUrl": "https://res.cloudinary.com/.../nike-air.jpg"
      }
    ],
    "totalElements": 100,
    "totalPages": 10
  }
}
```

---

### 8.2 Customer — Chi tiết sản phẩm

```
GET /product/{id}
```

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "productId": 1,
    "productName": "Giày Nike Air Max",
    "productDescription": "Mô tả...",
    "avatarUrl": "https://res.cloudinary.com/.../nike-air.jpg",
    "brandId": 2,
    "brandName": "Nike",
    "categoryId": 3,
    "categoryName": "Giày thể thao",
    "minPrice": 1200000.00,
    "maxPrice": 1800000.00,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T08:00:00",
    "modifiedAt": "2024-06-01T10:00:00",
    "createdBy": "admin",
    "modifiedBy": "staff01",
    "variants": [
      {
        "variantId": 10,
        "variantSkuCode": "NIKE-AIR-RED-42",
        "variantPrice": 1200000.00,
        "stockQuantity": 50,
        "attributes": [
          { "attributeId": 1, "attributeName": "Màu sắc", "attributeValue": "Đỏ" },
          { "attributeId": 2, "attributeName": "Size", "attributeValue": "42" }
        ],
        "variantImageUrl": [
          { "imageId": 100, "imageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg", "isAvatar": true },
          { "imageId": 101, "imageUrl": "https://res.cloudinary.com/.../nike-red-42-2.jpg", "isAvatar": false }
        ]
      }
    ]
  }
}
```

---

### 8.3 Admin — Quản lý sản phẩm

> Yêu cầu: `ROLE_ADMIN`  
> Base path: `/management/product`

**Enum `ProductStatus`:**
```
ACTIVE    – đang bán
INACTIVE  – tạm ẩn
DRAFT     – tạo chưa hoàn tất
```

#### GET /management/product/search

**Query Parameters:**

| Param | Type | Ghi chú |
|-------|------|---------|
| `keyword` | string | Tìm theo tên sản phẩm |
| `categoryIds` | Long[] | Lọc theo nhiều category. Gửi lặp query param: `categoryIds=1&categoryIds=2` |
| `brandIds` | Long[] | Lọc theo nhiều brand. Gửi lặp query param: `brandIds=3&brandIds=4` |
| `minPrice` | double | ≥ 0 |
| `maxPrice` | double | ≥ 0 |
| `minRating` | int | 0–5 |
| `page` | int | Mặc định 0 |
| `size` | int | Mặc định 10 |
| `sortBy` | string | Trường sắp xếp |
| `sortType` | string | `asc` / `desc` |

`categoryIds` hoặc `brandIds` không truyền hay truyền rỗng sẽ không áp dụng bộ lọc tương ứng. Khi truyền cả hai, kết quả phải thuộc một category trong `categoryIds` và một brand trong `brandIds`.

Ví dụ: `GET /management/product/search?categoryIds=1&categoryIds=2&brandIds=3&page=0&size=10`

**Response:** Phân trang, mỗi item chứa `id, name, description, avatarUrl, status, categoryName, brandName, createdAt, ...`

> ⚠️ Lưu ý: `categoryName` và `brandName` trong `ProductResponse` là `Long` (chứa ID).

#### GET /management/product/{id}

**Response:** Product object (giống item trong list search).

#### GET /management/product/{productId}/variants

**Response 200:**
```json
{
  "code": 1000,
  "result": [
    {
      "id": 10,
      "skuCode": "NIKE-AIR-RED-42",
      "price": 1200000.0,
      "stockQuantity": 50,
      "attributes": [
        { "attributeId": 1, "attributeName": "Màu sắc", "attributeValue": "Đỏ" }
      ],
      "variantImageUrl": [
        { "imageId": 100, "imageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg", "isAvatar": true }
      ]
    }
  ]
}
```

#### POST /management/product/create

```json
{
  "name": "Giày Nike Air Max",
  "description": "Mô tả...",
  "categoryId": 3,
  "brandId": 2,
  "productAvatarUrl": "https://res.cloudinary.com/.../nike-air.jpg",
  "variants": [
    {
      "skuCode": "NIKE-AIR-RED-42",
      "price": 1200000.00,
      "stockQuantity": 50,
      "attributes": { "Màu sắc": "Đỏ", "Size": "42" },
      "variantAvatarUrl": "https://res.cloudinary.com/.../nike-red-42.jpg",
      "variantImageUrls": [
        "https://res.cloudinary.com/.../nike-red-42-2.jpg",
        "https://res.cloudinary.com/.../nike-red-42-3.jpg"
      ]
    }
  ]
}
```

**Response:** 204 No Content

#### POST /management/product/{productId}/variants

```json
{
  "skuCode": "NIKE-AIR-BLUE-43",
  "price": 1300000.00,
  "stockQuantity": 30,
  "attributes": { "Màu sắc": "Xanh", "Size": "43" },
  "variantAvatarUrl": "https://res.cloudinary.com/.../nike-blue-43.jpg",
  "variantImageUrls": ["https://res.cloudinary.com/.../nike-blue-43-2.jpg"]
}
```

#### PUT /management/product/update

```json
{
  "productId": 1,
  "name": "Giày Nike Air Max 2024",
  "description": "Mô tả mới...",
  "categoryId": 3,
  "brandId": 2,
  "productAvatarUrl": "https://res.cloudinary.com/.../nike-air-new.jpg",
  "variants": [
    {
      "variantId": 10,
      "skuCode": "NIKE-AIR-RED-42",
      "price": 1250000.00,
      "stockQuantity": 45,
      "variantAvatarUrl": "https://res.cloudinary.com/.../nike-red-42-new.jpg",
      "attributes": { "Màu sắc": "Đỏ", "Size": "42" },
      "variantImageIdsToDelete": [101],
      "variantImagesUrlsToAdd": ["https://res.cloudinary.com/.../nike-red-42-extra.jpg"]
    }
  ]
}
```

> `variantAvatarUrl = null` giữ ảnh cũ · `""` xóa ảnh.

#### PATCH /management/product/{productId}/{status}

| `status` | Ý nghĩa |
|----------|---------|
| `ACTIVE` | Đang bán |
| `INACTIVE` | Tạm ẩn |

#### PATCH /management/product/variant/{variantId}/{stockQuantity}

Cập nhật số lượng tồn kho. **Response:** 204 No Content.

---

## 9. API Reference — Cart

> Yêu cầu: Bearer token  
> Base path: `/cart-item`

### 9.1 Lấy giỏ hàng

```
GET /cart-item/my-cart
```

**Response 200 — có sản phẩm:**
```json
{
  "code": 1000,
  "message": "Get cart successfully",
  "result": [
    {
      "cartItemId": 1,
      "productId": 10,
      "productName": "Giày Nike Air Max",
      "productStatus": "ACTIVE",
      "currentVariantId": "25",
      "variantSkuCode": "NIKE-AIR-RED-42",
      "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg",
      "variantPrice": 1200000.00,
      "stockQuantity": 50,
      "cartItemQuantity": 2
    }
  ]
}
```

Giỏ trống: `result = null`.

### 9.2 Thêm vào giỏ

```
POST /cart-item/add
```

```json
{ "variantId": 25, "quantity": 2 }
```

> Nếu variant đã có trong giỏ, số lượng **cộng thêm**.  
> **Response:** 204 No Content

### 9.3 Cập nhật số lượng

```
PATCH /cart-item/update
```

```json
{ "cartItemId": 1, "variantId": 25, "quantity": 3 }
```

**Response 200:** String `"Cart item updated successfully"` (không bọc ApiResponse).

### 9.4 Xóa khỏi giỏ

```
DELETE /cart-item/remove/{ids}
```

`ids` là danh sách `cartItemId` phân cách dấu phẩy:  
`DELETE /cart-item/remove/1,2,3`

**Response:** 204 No Content

---

## 10. API Reference — Order

> Yêu cầu: Bearer token

### 10.1 Customer — Xem trước đơn hàng

```
GET /orders/preview
```

**Request Body:**
```json
[
  { "variantId": 25, "quantity": 2 },
  { "variantId": 30, "quantity": 1 }
]
```

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "shippingAddress": "456 Đường XYZ, Hà Nội",
    "shippingFee": 30000.00,
    "totalPrice": 2430000.00,
    "paymentMethods": ["COD", "VNPAY", "MOMO", "BANK_TRANSFER", "PAYPAL"],
    "items": [
      {
        "productId": 10,
        "productName": "Giày Nike Air Max",
        "skuCode": "NIKE-AIR-RED-42",
        "quantity": 2,
        "price": 1200000.00,
        "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg"
      }
    ]
  }
}
```

> `fullName`, `phoneNumber`, `shippingAddress` lấy tự động từ tài khoản.  
> `totalPrice` = tổng tiền hàng + `shippingFee`.

### 10.2 Customer — Đặt hàng

```
POST /orders/checkout
```

```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0912345678",
  "paymentMethod": "COD",
  "shippingAddress": "456 Đường XYZ, Hà Nội",
  "items": [
    { "variantId": 25, "quantity": 2 },
    { "variantId": 30, "quantity": 1 }
  ]
}
```

| Field | Type | Bắt buộc |
|-------|------|----------|
| `fullName` | string | ✅ |
| `phoneNumber` | string | ✅ |
| `paymentMethod` | string | ✅ — `COD`, `VNPAY`, `MOMO`, `BANK_TRANSFER`, `PAYPAL` |
| `shippingAddress` | string | ✅ |
| `items[].variantId` | Long | ✅ |
| `items[].quantity` | int | ✅ |

**Response:** 204 No Content

### 10.3 Customer — Danh sách đơn hàng

```
GET /orders/my-orders
```

**Response 200:**
```json
{
  "code": 1000,
  "result": [
    {
      "orderId": 100,
      "totalPrice": 2430000.00,
      "status": "PENDING",
      "items": [
        {
          "productName": "Giày Nike Air Max",
          "skuCode": "NIKE-AIR-RED-42",
          "quantity": 2,
          "price": 1200000.00,
          "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg"
        }
      ]
    }
  ]
}
```

### 10.4 Customer — Chi tiết đơn hàng

```
GET /orders/my-orders/{orderId}
```

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "orderId": 100,
    "userId": 5,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "shippingAddress": "456 Đường XYZ, Hà Nội",
    "shippingFee": 30000.00,
    "totalPrice": 2430000.00,
    "status": "PENDING",
    "isPaid": false,
    "paymentMethod": "COD",
    "paymentDate": null,
    "createdAt": "2024-06-01T10:00:00",
    "modifiedAt": "2024-06-01T10:00:00",
    "createdBy": "customer01",
    "modifiedBy": "customer01",
    "items": [
      {
        "productId": 10,
        "productName": "Giày Nike Air Max",
        "skuCode": "NIKE-AIR-RED-42",
        "quantity": 2,
        "price": 1200000.00,
        "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg"
      }
    ]
  }
}
```

**Enum `OrderStatus`:**
```
PENDING    – Chờ xác nhận
CONFIRMED  – Đã xác nhận
SHIPPING   – Đang giao
DELIVERED  – Giao thành công
CANCELLED  – Đã hủy
RETURNED   – Trả hàng / hoàn tiền
```

---

### 10.5 Admin — Quản lý đơn hàng

> Yêu cầu: `ROLE_ADMIN`  
> Base path: `/management/order`

> ⚠️ `page` bắt đầu từ **0**.

#### GET /management/order/search

**Query Parameters:**

| Param | Type | Mặc định |
|-------|------|----------|
| `page` | int | 0 |
| `size` | int | 10 |
| `sortBy` | string | `createdAt` |
| `sortType` | string | `desc` |

**Response 200:** Phân trang, mỗi item chứa các thông tin đơn hàng (orderId, status, totalPrice, ...), **không** bao gồm danh sách sản phẩm (`items`).

#### GET /management/order/{orderId}

**Response 200:** Order detail object.

#### PATCH /management/order/{orderId}/{status}

| `status` | Ý nghĩa |
|----------|---------|
| `CONFIRMED` | Xác nhận |
| `SHIPPING` | Bắt đầu giao |
| `DELIVERED` | Đã giao |
| `CANCELLED` | Hủy |
| `RETURNED` | Trả hàng |

**Response:** 204 No Content

---

## 11. API Reference — Dashboard (Admin)

> Yêu cầu: `ROLE_ADMIN`  
> Base path: `/management/statistics`

### 11.1 Tổng quan hệ thống

```
GET /management/statistics/overview
```

```json
{
  "code": 1000,
  "result": {
    "totalUsers": 1250,
    "totalProducts": 340
  }
}
```

### 11.2 Thống kê đơn hàng

```
POST /management/statistics/orders
```

```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-06-30"
}
```

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "fromDate": "2024-01-01",
    "toDate": "2024-06-30",
    "totalOrders": 520,
    "paidOrders": 410,
    "pendingOrders": 30,
    "confirmedOrders": 25,
    "shippingOrders": 15,
    "deliveredOrders": 400,
    "cancelledOrders": 40,
    "returnedOrders": 10,
    "totalRevenue": 625000000.00,
    "statusStatistics": [
      { "status": "PENDING",   "count": 30 },
      { "status": "CONFIRMED", "count": 25 },
      { "status": "DELIVERED", "count": 400 },
      { "status": "CANCELLED", "count": 40 }
    ]
  }
}
```

### 11.3 Báo cáo doanh thu

```
POST /management/statistics/revenue
```

```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-06-30",
  "groupBy": "MONTH"
}
```

| `groupBy` | Format `period` | Ví dụ |
|-----------|-----------------|-------|
| `DAY` | `YYYY-MM-DD` | `2024-01-15` |
| `MONTH` | `YYYY-MM` | `2024-01` |
| `QUARTER` | `YYYY-Qn` | `2024-Q1` |
| `YEAR` | `YYYY` | `2024` |

**Response 200:**
```json
{
  "code": 1000,
  "result": {
    "groupBy": "MONTH",
    "fromDate": "2024-01-01",
    "toDate": "2024-06-30",
    "totalOrders": 520,
    "paidOrders": 410,
    "totalRevenue": 625000000.00,
    "items": [
      { "period": "2024-01", "orders": 80, "paidOrders": 65, "revenue": 98000000.00 },
      { "period": "2024-02", "orders": 75, "paidOrders": 60, "revenue": 91500000.00 }
    ]
  }
}
```

---

## 12. Role & Permission Matrix

| Chức năng | `ROLE_CUSTOMER` | `ROLE_DELIVERY_STAFF` | `ROLE_ADMIN` |
|-----------|:---------------:|:---------------------:|:------------:|
| Đăng nhập / Đăng ký | ❌ (public) | ❌ (public) | ❌ (public) |
| Xem sản phẩm | ❌ (public) | ❌ (public) | ❌ (public) |
| Giỏ hàng | ✅ | ❌ | ❌ |
| Đặt hàng / Lịch sử đơn | ✅ | ❌ | ❌ |
| Quản lý đơn hàng | ❌ | ❌ | ✅ |
| Xem thông tin khách hàng | ❌ | ❌ | ✅ |
| Quản lý Brand/Category | ❌ | ❌ | ✅ |
| CRUD Sản phẩm & Variant | ❌ | ❌ | ✅ |
| Quản lý người dùng | ❌ | ❌ | ✅ |
| Dashboard / Thống kê | ❌ | ❌ | ✅ |
| Upload ảnh (Cloudinary) | ❌ | ✅ | ✅ |

---

## 13. Mapping Màn hình → API

### Customer (Shop)

| Màn hình | API chính |
|----------|----------|
| Trang chủ / Listing sản phẩm | `GET /search` |
| Chi tiết sản phẩm | `GET /product/{id}` |
| Filter theo Brand/Category | `GET /brands`, `GET /categories` |
| Giỏ hàng | `GET /cart-item/my-cart` |
| Checkout Preview | `GET /orders/preview` |
| Đặt hàng | `POST /orders/checkout` |
| Đơn hàng của tôi | `GET /orders/my-orders` |
| Chi tiết đơn hàng | `GET /orders/my-orders/{orderId}` |
| Tài khoản cá nhân | `GET /users/my-info` |
| Cập nhật thông tin | `PATCH /users/update-info` |
| Đổi mật khẩu | `PATCH /users/change-password` |

### Admin Dashboard

| Màn hình | API chính |
|----------|----------|
| Tổng quan | `GET /management/statistics/overview` |
| Thống kê đơn hàng | `POST /management/statistics/orders` |
| Báo cáo doanh thu | `POST /management/statistics/revenue` |
| Quản lý người dùng | `GET /management/users`, `POST /management/users` |
| Cập nhật role/status | `PATCH /management/users/update-role`, `PATCH /management/users/{id}/{status}` |
| Quản lý Brand | `GET /management/brands/search`, `POST /management/brands`, `PATCH /management/brands/update` |
| Quản lý Category | `GET /management/categories/search`, `POST /management/categories`, `PUT /management/categories` |
| Quản lý sản phẩm | `GET /management/product/search`, `POST /management/product/create` |
| Chi tiết / Sửa sản phẩm | `GET /management/product/{id}`, `PUT /management/product/update` |
| Quản lý tồn kho | `PATCH /management/product/variant/{variantId}/{stockQuantity}` |
| Quản lý đơn hàng | `GET /management/order/search`, `PATCH /management/order/{orderId}/{status}` |

---

## 14. Workflow điển hình

### Workflow mua hàng (Customer)

```
1. Truy cập trang chủ          → GET /search
2. Xem chi tiết sản phẩm       → GET /product/{id}
3. Chọn variant, thêm vào giỏ  → POST /cart-item/add
4. Xem giỏ hàng                → GET /cart-item/my-cart
5. Cập nhật số lượng            → PATCH /cart-item/update
6. Xóa item                     → DELETE /cart-item/remove/{id}
7. Xem trước đơn hàng           → GET /orders/preview  (body: [{variantId, quantity}])
8. Đặt hàng                     → POST /orders/checkout
9. Xem đơn hàng của tôi         → GET /orders/my-orders
10. Xem chi tiết đơn             → GET /orders/my-orders/{orderId}
```

### Workflow quản lý sản phẩm (Admin)

```
1. Upload ảnh lên Cloudinary     → GET /cloudinary/signature → POST Cloudinary
2. Tạo sản phẩm mới             → POST /management/product/create
3. Thêm variant cho sản phẩm    → POST /management/product/{productId}/variants
4. Cập nhật thông tin           → PUT /management/product/update
5. Thay đổi trạng thái           → PATCH /management/product/{productId}/{status}
6. Cập nhật tồn kho             → PATCH /management/product/variant/{variantId}/{stockQuantity}
```

### Workflow quản lý đơn hàng (Admin)

```
1. Xem danh sách đơn hàng       → GET /management/order/search
2. Xem chi tiết đơn              → GET /management/order/{orderId}
3. Xác nhận đơn                  → PATCH /management/order/{orderId}/CONFIRMED
4. Bắt đầu giao                 → PATCH /management/order/{orderId}/SHIPPING
5. Xác nhận đã giao             → PATCH /management/order/{orderId}/DELIVERED
6. Hủy đơn                       → PATCH /management/order/{orderId}/CANCELLED
```

---

## 15. Lưu ý triển khai

### Phân trang

Tất cả các API phân trang đều sử dụng `page` bắt đầu từ **0** (zero-based paging).

### Format tiền tệ

`price`, `totalPrice`, `totalRevenue`, `shippingFee` đều là `BigDecimal` từ backend. Hiển thị theo locale `vi-VN` với đơn vị `VND`.

```javascript
new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
```

### Ảnh sản phẩm

- Upload lên Cloudinary trước, lấy `secure_url` gửi vào backend.
- `null` = giữ ảnh cũ, `""` (chuỗi rỗng) = xóa ảnh.

### Toast / Error Handling

- Bọc API calls trong `try/catch`, hiển thị toast dựa trên `code` và `message` từ response.
- Với lỗi `401 TOKEN_EXPIRED`, tự động gọi refresh token trước khi báo lỗi.