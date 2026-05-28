# Product Catalog API

Module quản lý **Thương hiệu (Brand)** và **Danh mục (Category)**.

---

## Wrapper Response chung

```json
{
  "code": 1000,
  "message": "...",
  "result": { ... }
}
```

- `code`: `1000` = thành công.
- `result`: `null` với các response 204 No Content.

---

## Lưu ý về ảnh (Cloudinary)

Frontend cần **upload ảnh lên Cloudinary trước**, lấy URL trả về rồi gửi vào field `imageUrl`.  
Backend **không nhận file trực tiếp**.

---

# BRAND – Thương hiệu

## 1. Customer

### 1.1 Lấy danh sách thương hiệu đang hoạt động

```
GET /brands
```

Không cần auth. Không có query param.

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get brands successfully",
  "result": [
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
  ]
}
```

---

## 2. Admin – Thương hiệu

> Yêu cầu: role `ROLE_ADMIN`

### 2.1 Tìm kiếm thương hiệu (có lọc & phân trang)

```
GET /admin/brands/search
```

**Query Parameters:**

| Param              | Type         | Bắt buộc | Mô tả                              |
|--------------------|--------------|----------|------------------------------------|
| `keyword`          | string       | ❌        | Tìm theo tên thương hiệu           |
| `createdDateFrom`  | ISO datetime | ❌        | VD: `2024-01-01T00:00:00`          |
| `createdDateTo`    | ISO datetime | ❌        |                                    |
| `modifiedDateFrom` | ISO datetime | ❌        |                                    |
| `modifiedDateTo`   | ISO datetime | ❌        |                                    |
| `page`             | int (≥ 0)    | ❌        | Mặc định: `0`                      |
| `size`             | int (≥ 1)    | ❌        | Mặc định: `10`                     |
| `sortBy`           | string       | ❌        | VD: `createdAt`, `brandName`       |
| `sortType`         | string       | ❌        | `asc` hoặc `desc`                  |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get brands successfully",
  "result": {
    "content": [
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
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 25,
    "totalPages": 3,
    "first": true,
    "last": false
  }
}
```

---

### 2.2 Tạo thương hiệu mới

```
POST /admin/brands
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Nike",
  "description": "Just Do It",
  "imageUrl": "https://res.cloudinary.com/.../nike.jpg"
}
```

| Field         | Type   | Bắt buộc | Ghi chú                                  |
|---------------|--------|----------|------------------------------------------|
| `name`        | string | ✅        |                                          |
| `description` | string | ❌        |                                          |
| `imageUrl`    | string | ❌        | URL ảnh đã upload lên Cloudinary         |

**Response 204:** No Content

---

### 2.3 Cập nhật thương hiệu

```
PATCH /admin/brands/update
Content-Type: application/json
```

**Request Body:**
```json
{
  "brandId": 1,
  "name": "Nike Updated",
  "description": "Mô tả mới",
  "imageUrl": "https://res.cloudinary.com/.../nike-new.jpg"
}
```

| Field         | Type   | Bắt buộc | Ghi chú                                                        |
|---------------|--------|----------|----------------------------------------------------------------|
| `brandId`     | Long   | ✅        |                                                                |
| `name`        | string | ✅        |                                                                |
| `description` | string | ❌        |                                                                |
| `imageUrl`    | string | ❌        | `null` = giữ ảnh cũ · `""` (chuỗi rỗng) = xóa ảnh hiện tại  |

**Response 204:** No Content

---

### 2.4 Cập nhật trạng thái thương hiệu

```
PATCH /admin/brands/{brandId}/{status}
```

| Param      | Type   | Mô tả                                    |
|------------|--------|------------------------------------------|
| `brandId`  | Long   | ID thương hiệu                           |
| `status`   | string | Trạng thái mới (xem logic backend)       |

**Response 204:** No Content

---

# CATEGORY – Danh mục

## 3. Customer

### 3.1 Lấy danh sách danh mục đang hoạt động

```
GET /categories
```

Không cần auth. Không có query param.

**Response 200:**
```json
{
  "code": 1000,
  "message": "Categories retrieved successfully",
  "result": [
    {
      "categoryId": 1,
      "categoryName": "Giày thể thao",
      "categoryDescription": "Các loại giày dùng cho thể thao",
      "imageUrl": "https://res.cloudinary.com/.../sneaker.jpg",
      "isEnabled": true,
      "createdAt": "2024-01-01T08:00:00",
      "modifiedAt": "2024-06-01T10:00:00",
      "createdBy": "admin",
      "modifiedBy": "admin"
    }
  ]
}
```

---

## 4. Admin – Danh mục

> Yêu cầu: role `ROLE_ADMIN`

### 4.1 Tìm kiếm danh mục (có lọc & phân trang)

```
GET /admin/categories/search
```

**Query Parameters:**

| Param              | Type         | Bắt buộc | Mô tả                              |
|--------------------|--------------|----------|------------------------------------|
| `keyword`          | string       | ❌        | Tìm theo tên danh mục              |
| `createdDateFrom`  | ISO datetime | ❌        | VD: `2024-01-01T00:00:00`          |
| `createdDateTo`    | ISO datetime | ❌        |                                    |
| `modifiedDateFrom` | ISO datetime | ❌        |                                    |
| `modifiedDateTo`   | ISO datetime | ❌        |                                    |
| `page`             | int (≥ 0)    | ❌        | Mặc định: `0`                      |
| `size`             | int (≥ 1)    | ❌        | Mặc định: `10`                     |
| `sortBy`           | string       | ❌        | VD: `createdAt`, `categoryName`    |
| `sortType`         | string       | ❌        | `asc` hoặc `desc`                  |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Categories retrieved successfully",
  "result": {
    "content": [
      {
        "categoryId": 1,
        "categoryName": "Giày thể thao",
        "categoryDescription": "Các loại giày dùng cho thể thao",
        "imageUrl": "https://res.cloudinary.com/.../sneaker.jpg",
        "isEnabled": true,
        "createdAt": "2024-01-01T08:00:00",
        "modifiedAt": "2024-06-01T10:00:00",
        "createdBy": "admin",
        "modifiedBy": "admin"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 12,
    "totalPages": 2,
    "first": true,
    "last": false
  }
}
```

---

### 4.2 Tạo danh mục mới

```
POST /admin/categories
Content-Type: application/json
```

**Request Body:**
```json
{
  "categoryName": "Giày thể thao",
  "categoryDescription": "Các loại giày dùng cho thể thao",
  "imageUrl": "https://res.cloudinary.com/.../sneaker.jpg"
}
```

| Field                 | Type   | Bắt buộc | Ghi chú                                  |
|-----------------------|--------|----------|------------------------------------------|
| `categoryName`        | string | ✅        |                                          |
| `categoryDescription` | string | ❌        |                                          |
| `imageUrl`            | string | ❌        | URL ảnh đã upload lên Cloudinary         |

**Response 204:** No Content

---

### 4.3 Cập nhật danh mục

```
PUT /admin/categories
Content-Type: application/json
```

**Request Body:**
```json
{
  "categoryId": 1,
  "categoryName": "Giày thể thao updated",
  "categoryDescription": "Mô tả mới",
  "imageUrl": "https://res.cloudinary.com/.../sneaker-new.jpg"
}
```

| Field                 | Type   | Bắt buộc | Ghi chú                                                        |
|-----------------------|--------|----------|----------------------------------------------------------------|
| `categoryId`          | Long   | ✅        |                                                                |
| `categoryName`        | string | ❌        |                                                                |
| `categoryDescription` | string | ❌        |                                                                |
| `imageUrl`            | string | ❌        | `null` = giữ ảnh cũ · `""` (chuỗi rỗng) = xóa ảnh hiện tại  |

**Response 204:** No Content

---

### 4.4 Cập nhật trạng thái danh mục

```
PATCH /admin/categories/{categoryId}/{status}
```

| Param        | Type   | Mô tả                              |
|--------------|--------|------------------------------------|
| `categoryId` | Long   | ID danh mục                        |
| `status`     | string | Trạng thái mới (xem logic backend) |

**Response 204:** No Content

---

## Lỗi phổ biến

| HTTP Status | Ý nghĩa                                   |
|-------------|-------------------------------------------|
| 400         | Dữ liệu request không hợp lệ (validation) |
| 401         | Chưa xác thực (thiếu / sai token)         |
| 403         | Không có quyền truy cập                   |
| 404         | Không tìm thấy brand / category           |

**Ví dụ response lỗi:**
```json
{
  "code": 4001,
  "message": "Brand not found"
}
```
