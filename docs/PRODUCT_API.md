# Product API

Module quản lý **Sản phẩm (Product)** và **Biến thể (Variant)**.

---

## Wrapper Response chung

```json
{
  "code": 1000,
  "message": "...",
  "result": { ... }
}
```

---

## Enum: ProductStatus

```
ACTIVE    – đang bán
INACTIVE  – tạm ẩn
DRAFT     – tạo chưa hoàn tất
```

---

## Lưu ý về ảnh (Cloudinary)

Frontend **upload ảnh lên Cloudinary trước**, lấy URL rồi gửi vào các field `*Url`.  
Backend không nhận file trực tiếp.

---

# 1. Customer – Sản phẩm

> Không yêu cầu auth. Chỉ trả về sản phẩm `ACTIVE`.

### 1.1 Tìm kiếm sản phẩm

```
GET /search
```

**Query Parameters:**

| Param       | Type          | Bắt buộc | Mô tả                          |
|-------------|---------------|----------|--------------------------------|
| `keyword`   | string        | ❌        | Tìm theo tên sản phẩm          |
| `categoryId`| Long          | ❌        | Lọc theo danh mục              |
| `brandId`   | Long          | ❌        | Lọc theo thương hiệu           |
| `minPrice`  | double (≥ 0)  | ❌        | Giá tối thiểu                  |
| `maxPrice`  | double (≥ 0)  | ❌        | Giá tối đa                     |
| `minRating` | int (0–5)     | ❌        | Đánh giá tối thiểu             |
| `page`      | int (≥ 0)     | ❌        | Mặc định: `0`                  |
| `size`      | int (≥ 1)     | ❌        | Mặc định: `10`                 |
| `sortBy`    | string        | ❌        | VD: `minPrice`, `productName`  |
| `sortType`  | string        | ❌        | `asc` hoặc `desc`              |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get list product successfully",
  "result": {
    "content": [
      {
        "productId": 1,
        "productName": "Giày Nike Air Max",
        "minPrice": 1200000.00,
        "avatarUrl": "https://res.cloudinary.com/.../nike-air.jpg"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false
  }
}
```

---

### 1.2 Lấy chi tiết sản phẩm

```
GET /product/{id}
```

| Param | Type | Mô tả      |
|-------|------|------------|
| `id`  | Long | ID sản phẩm |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "productId": 1,
    "productName": "Giày Nike Air Max",
    "productDescription": "Mô tả sản phẩm...",
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
          {
            "attributeId": 1,
            "attributeName": "Màu sắc",
            "attributeValue": "Đỏ"
          },
          {
            "attributeId": 2,
            "attributeName": "Size",
            "attributeValue": "42"
          }
        ],
        "variantImageUrl": [
          {
            "imageId": 100,
            "imageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg",
            "isAvatar": true
          },
          {
            "imageId": 101,
            "imageUrl": "https://res.cloudinary.com/.../nike-red-42-2.jpg",
            "isAvatar": false
          }
        ]
      }
    ]
  }
}
```

---

# 2. Staff / Admin – Quản lý sản phẩm

> Yêu cầu: role `ROLE_STAFF` hoặc `ROLE_ADMIN`  
> Base path: `/management`

### 2.1 Tìm kiếm sản phẩm (tất cả trạng thái)

```
GET /management/product/search
```

**Query Parameters:** _(giống Customer search, thêm lọc theo status nếu backend hỗ trợ)_

| Param       | Type          | Bắt buộc | Mô tả                          |
|-------------|---------------|----------|--------------------------------|
| `keyword`   | string        | ❌        | Tìm theo tên sản phẩm          |
| `categoryId`| Long          | ❌        | Lọc theo danh mục              |
| `brandId`   | Long          | ❌        | Lọc theo thương hiệu           |
| `minPrice`  | double (≥ 0)  | ❌        |                                |
| `maxPrice`  | double (≥ 0)  | ❌        |                                |
| `minRating` | int (0–5)     | ❌        |                                |
| `page`      | int (≥ 0)     | ❌        | Mặc định: `0`                  |
| `size`      | int (≥ 1)     | ❌        | Mặc định: `10`                 |
| `sortBy`    | string        | ❌        |                                |
| `sortType`  | string        | ❌        | `asc` hoặc `desc`              |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "content": [
      {
        "id": 1,
        "name": "Giày Nike Air Max",
        "description": "Mô tả sản phẩm...",
        "avatarUrl": "https://res.cloudinary.com/.../nike-air.jpg",
        "status": "ACTIVE",
        "categoryName": 3,
        "brandName": 2,
        "createdAt": "2024-01-01T08:00:00",
        "modifiedAt": "2024-06-01T10:00:00",
        "createdBy": "admin",
        "modifiedBy": "staff01"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 50,
    "totalPages": 5,
    "first": true,
    "last": false
  }
}
```

> ⚠️ Lưu ý: `categoryName` và `brandName` trong `ProductResponse` hiện có kiểu `Long` (là ID), không phải string tên. Cần xác nhận lại với backend.

---

### 2.2 Lấy chi tiết sản phẩm theo ID

```
GET /management/product/{id}
```

| Param | Type | Mô tả      |
|-------|------|------------|
| `id`  | Long | ID sản phẩm |

**Response 200:** _(cấu trúc giống `ProductResponse` ở 2.1, là object đơn)_
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "id": 1,
    "name": "Giày Nike Air Max",
    "description": "Mô tả sản phẩm...",
    "avatarUrl": "https://res.cloudinary.com/.../nike-air.jpg",
    "status": "ACTIVE",
    "categoryName": 3,
    "brandName": 2,
    "createdAt": "2024-01-01T08:00:00",
    "modifiedAt": "2024-06-01T10:00:00",
    "createdBy": "admin",
    "modifiedBy": "staff01"
  }
}
```

---

### 2.3 Lấy danh sách biến thể của sản phẩm

```
GET /management/product/{productId}/variants
```

| Param       | Type | Mô tả      |
|-------------|------|------------|
| `productId` | Long | ID sản phẩm |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get product variants successfully",
  "result": [
    {
      "id": 10,
      "skuCode": "NIKE-AIR-RED-42",
      "price": 1200000.0,
      "stockQuantity": 50,
      "createdAt": "2024-01-01T08:00:00",
      "modifiedAt": "2024-06-01T10:00:00",
      "createdBy": "admin",
      "modifiedBy": "staff01",
      "attributes": [
        {
          "attributeId": 1,
          "attributeName": "Màu sắc",
          "attributeValue": "Đỏ"
        }
      ],
      "variantImageUrl": [
        {
          "imageId": 100,
          "imageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg",
          "isAvatar": true
        }
      ]
    }
  ]
}
```

---

### 2.4 Tạo sản phẩm mới

```
POST /management/product/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Giày Nike Air Max",
  "description": "Mô tả sản phẩm...",
  "categoryId": 3,
  "brandId": 2,
  "productAvatarUrl": "https://res.cloudinary.com/.../nike-air.jpg",
  "variants": [
    {
      "skuCode": "NIKE-AIR-RED-42",
      "price": 1200000.00,
      "stockQuantity": 50,
      "attributes": {
        "Màu sắc": "Đỏ",
        "Size": "42"
      },
      "variantAvatarUrl": "https://res.cloudinary.com/.../nike-red-42.jpg",
      "variantImageUrls": [
        "https://res.cloudinary.com/.../nike-red-42-2.jpg",
        "https://res.cloudinary.com/.../nike-red-42-3.jpg"
      ]
    }
  ]
}
```

**Cấu trúc field:**

_Product:_

| Field              | Type     | Bắt buộc | Ghi chú                              |
|--------------------|----------|----------|--------------------------------------|
| `name`             | string   | ❌        |                                      |
| `description`      | string   | ❌        |                                      |
| `categoryId`       | Long     | ❌        |                                      |
| `brandId`          | Long     | ❌        |                                      |
| `productAvatarUrl` | string   | ❌        | URL ảnh đại diện sản phẩm            |
| `variants`         | array    | ❌        | Danh sách biến thể khởi tạo cùng lúc |

_Mỗi variant trong `variants`:_

| Field               | Type              | Bắt buộc | Ghi chú                              |
|---------------------|-------------------|----------|--------------------------------------|
| `skuCode`           | string            | ✅        |                                      |
| `price`             | decimal (≥ 0)     | ✅        |                                      |
| `stockQuantity`     | int (≥ 0)         | ✅        |                                      |
| `attributes`        | map<string,string>| ❌        | Key = tên thuộc tính, Value = giá trị |
| `variantAvatarUrl`  | string            | ❌        | Ảnh đại diện biến thể                |
| `variantImageUrls`  | string[]          | ❌        | Danh sách ảnh gallery biến thể       |

**Response 204:** No Content

---

### 2.5 Thêm biến thể mới vào sản phẩm đã có

```
POST /management/product/{productId}/variants
Content-Type: application/json
```

| Param       | Type | Mô tả      |
|-------------|------|------------|
| `productId` | Long | ID sản phẩm |

**Request Body:**
```json
{
  "skuCode": "NIKE-AIR-BLUE-43",
  "price": 1300000.00,
  "stockQuantity": 30,
  "attributes": {
    "Màu sắc": "Xanh",
    "Size": "43"
  },
  "variantAvatarUrl": "https://res.cloudinary.com/.../nike-blue-43.jpg",
  "variantImageUrls": [
    "https://res.cloudinary.com/.../nike-blue-43-2.jpg"
  ]
}
```

| Field              | Type               | Bắt buộc | Ghi chú                               |
|--------------------|--------------------|----------|---------------------------------------|
| `skuCode`          | string             | ✅        |                                       |
| `price`            | decimal (≥ 0)      | ✅        |                                       |
| `stockQuantity`    | int (≥ 0)          | ✅        |                                       |
| `attributes`       | map<string,string> | ❌        | Key = tên thuộc tính, Value = giá trị |
| `variantAvatarUrl` | string             | ❌        |                                       |
| `variantImageUrls` | string[]           | ❌        |                                       |

**Response 204:** No Content

---

### 2.6 Cập nhật sản phẩm

```
PUT /management/product/update
Content-Type: application/json
```

**Request Body:**
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
      "attributes": {
        "Màu sắc": "Đỏ",
        "Size": "42"
      },
      "variantImageIdsToDelete": [101],
      "variantImagesUrlsToAdd": [
        "https://res.cloudinary.com/.../nike-red-42-extra.jpg"
      ]
    }
  ]
}
```

_Product:_

| Field              | Type   | Bắt buộc | Ghi chú                                                       |
|--------------------|--------|----------|---------------------------------------------------------------|
| `productId`        | Long   | ✅        |                                                               |
| `name`             | string | ❌        |                                                               |
| `description`      | string | ❌        |                                                               |
| `categoryId`       | Long   | ❌        |                                                               |
| `brandId`          | Long   | ❌        |                                                               |
| `productAvatarUrl` | string | ❌        | `null` = giữ ảnh cũ · `""` = xóa ảnh                        |
| `variants`         | array  | ❌        |                                                               |

_Mỗi variant trong `variants`:_

| Field                    | Type               | Bắt buộc | Ghi chú                                                       |
|--------------------------|--------------------|----------|---------------------------------------------------------------|
| `variantId`              | Long               | ✅        |                                                               |
| `skuCode`                | string             | ✅        |                                                               |
| `price`                  | decimal (≥ 0)      | ✅        |                                                               |
| `stockQuantity`          | int (≥ 0)          | ✅        |                                                               |
| `variantAvatarUrl`       | string             | ❌        | `null` = giữ ảnh cũ · `""` = xóa ảnh                        |
| `attributes`             | map<string,string> | ❌        |                                                               |
| `variantImageIdsToDelete`| Long[]             | ❌        | Danh sách `imageId` cần xóa khỏi gallery                     |
| `variantImagesUrlsToAdd` | string[]           | ❌        | Danh sách URL ảnh mới cần thêm vào gallery                   |

**Response 204:** No Content

---

### 2.7 Cập nhật trạng thái sản phẩm

```
PATCH /management/product/{productId}/{status}
```

| Param       | Type   | Mô tả                                    |
|-------------|--------|------------------------------------------|
| `productId` | Long   | ID sản phẩm                              |
| `status`    | string | Trạng thái mới: `ACTIVE` / `INACTIVE`    |

**Response 204:** No Content

---

### 2.8 Cập nhật số lượng tồn kho biến thể

```
PATCH /management/variant/{variantId}/{stockQuantity}
```

| Param           | Type    | Mô tả                  |
|-----------------|---------|------------------------|
| `variantId`     | Long    | ID biến thể            |
| `stockQuantity` | Integer | Số lượng tồn kho mới   |

**Response 204:** No Content

---

## Lỗi phổ biến

| HTTP Status | Ý nghĩa                                   |
|-------------|-------------------------------------------|
| 400         | Dữ liệu request không hợp lệ (validation) |
| 401         | Chưa xác thực (thiếu / sai token)         |
| 403         | Không có quyền truy cập                   |
| 404         | Không tìm thấy sản phẩm / biến thể        |

**Ví dụ response lỗi:**
```json
{
  "code": 4001,
  "message": "Product not found"
}
```
