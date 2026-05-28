# Core API

Module nền tảng gồm 2 nhóm API phục vụ frontend trực tiếp:
- **Authentication** – đăng ký, đăng nhập, quản lý token
- **Cloudinary** – lấy signature để upload ảnh từ client

---

## Wrapper Response chung

Tất cả response đều bọc trong `ApiResponse<T>`:

```json
{
  "code": 1000,
  "message": "...",
  "result": { ... }
}
```

`code = 1000` là thành công. Các trường hợp lỗi trả về `code` và `message` tương ứng (xem bảng Error Code bên dưới).

---

# 1. Authentication

> Không yêu cầu auth (trừ các API cần token đã đăng nhập).  
> Base path: `/auth`

### 1.1 Đăng ký tài khoản

```
POST /auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "matkhau123",
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

| Field      | Type   | Bắt buộc | Ghi chú                  |
|------------|--------|----------|--------------------------|
| `username` | string | ✅        |                          |
| `password` | string | ✅        |                          |
| `email`    | string | ❌        | Phải đúng định dạng email |
| `fullName` | string | ❌        |                          |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Register successful",
  "result": {
    "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400
  }
}
```

---

### 1.2 Đăng nhập

```
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "matkhau123"
}
```

| Field      | Type   | Bắt buộc |
|------------|--------|----------|
| `username` | string | ✅        |
| `password` | string | ✅        |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400
  }
}
```

| Field             | Type   | Mô tả                                        |
|-------------------|--------|----------------------------------------------|
| `accessToken`     | string | JWT dùng để gọi các API cần xác thực         |
| `refreshToken`    | string | Token dùng để làm mới `accessToken`          |
| `tokenType`       | string | Luôn là `"Bearer"`                           |
| `expiresIn`       | Long   | Thời gian hết hạn của `accessToken` (giây)   |
| `refreshExpiresIn`| Long   | Thời gian hết hạn của `refreshToken` (giây)  |

> Sau khi đăng nhập, lưu `accessToken` và gửi kèm mọi request cần auth:  
> `Authorization: Bearer <accessToken>`

---

### 1.3 Làm mới Access Token

```
POST /auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiJ9..."
}
```

| Field          | Type   | Bắt buộc |
|----------------|--------|----------|
| `refreshToken` | string | ✅        |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Refresh token successful",
  "result": {
    "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400
  }
}
```

> Gọi API này khi `accessToken` hết hạn (nhận lỗi `TOKEN_EXPIRED`).  
> Response trả về cặp token mới — cần lưu lại cả `accessToken` lẫn `refreshToken` mới.

---

### 1.4 Đăng xuất

```
POST /auth/logout
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

| Field   | Type   | Bắt buộc | Ghi chú                  |
|---------|--------|----------|--------------------------|
| `token` | string | ✅        | Truyền `accessToken` hiện tại |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Logout successful",
  "result": {
    "success": true
  }
}
```

> Sau khi logout, token bị vô hiệu hóa phía server. Frontend cần xóa token khỏi storage.

---

### 1.5 Kiểm tra token (Introspect)

```
POST /auth/introspect
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

| Field   | Type   | Bắt buộc |
|---------|--------|----------|
| `token` | string | ✅        |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Introspect token successful",
  "result": {
    "active": true,
    "username": "john_doe",
    "tokenType": "Bearer",
    "expiresAt": 1719820800
  }
}
```

| Field       | Type    | Mô tả                                          |
|-------------|---------|------------------------------------------------|
| `active`    | boolean | `true` = token còn hiệu lực                    |
| `username`  | string  | Username của chủ token                         |
| `tokenType` | string  | Loại token                                     |
| `expiresAt` | Long    | Thời điểm hết hạn (Unix timestamp, giây)       |

---

# 2. Cloudinary – Upload ảnh

> Yêu cầu: đã đăng nhập (Bearer token)  
> Base path: `/cloudinary`

### 2.1 Lấy signature để upload ảnh

```
GET /cloudinary/signature?folder={folder}
```

| Param    | Type   | Bắt buộc | Mô tả                                                  |
|----------|--------|----------|--------------------------------------------------------|
| `folder` | string | ✅        | Tên thư mục trên Cloudinary (VD: `products`, `brands`) |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Cloudinary upload signature generated",
  "result": {
    "signature": "a1b2c3d4e5f6...",
    "timestamp": 1719820800,
    "cloudName": "your-cloud-name",
    "apiKey": "123456789012345",
    "folder": "products"
  }
}
```

| Field       | Type   | Mô tả                                              |
|-------------|--------|----------------------------------------------------|
| `signature` | string | Chữ ký xác thực để upload trực tiếp lên Cloudinary |
| `timestamp` | Long   | Thời điểm tạo signature (Unix timestamp)           |
| `cloudName` | string | Cloud name của Cloudinary                          |
| `apiKey`    | string | API key public của Cloudinary                      |
| `folder`    | string | Thư mục đích trên Cloudinary                       |

---

### Luồng upload ảnh từ frontend

```
1. Gọi GET /cloudinary/signature?folder=products
   → Nhận { signature, timestamp, cloudName, apiKey, folder }

2. Dùng thông tin trên POST trực tiếp lên Cloudinary:
   POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
   Body (multipart/form-data):
     file        = <file ảnh>
     api_key     = <apiKey>
     timestamp   = <timestamp>
     signature   = <signature>
     folder      = <folder>

3. Cloudinary trả về { secure_url, public_id, ... }
   → Lấy secure_url gửi vào các API backend (imageUrl, productAvatarUrl, ...)
```

---

# 3. Error Codes – Bảng mã lỗi đầy đủ

Khi có lỗi, response trả về HTTP status tương ứng và body:

```json
{
  "code": <error_code>,
  "message": "<mô tả lỗi>"
}
```

**Lỗi Validation (400)** – có thêm `result` chứa chi tiết từng field:
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

| Code | HTTP | Tên lỗi                      | Mô tả                                      |
|------|------|------------------------------|--------------------------------------------|
| 400  | 400  | `INVALID_REQUEST`            | Request không hợp lệ                       |
| 400  | 400  | `VALIDATION_ERROR`           | Lỗi validation field                       |
| 400  | 400  | `OLD_PASSWORD_INCORRECT`     | Mật khẩu cũ không đúng                     |
| 400  | 400  | `INVALID_QUANTITY`           | Số lượng không hợp lệ                      |
| 400  | 400  | `INSUFFICIENT_STOCK`         | Không đủ tồn kho                           |
| 401  | 401  | `UNAUTHORIZED`               | Chưa xác thực                              |
| 401  | 401  | `INVALID_USERNAME_OR_PASSWORD` | Sai username hoặc password               |
| 401  | 401  | `TOKEN_EXPIRED`              | Access token đã hết hạn → cần refresh     |
| 401  | 401  | `INVALID_TOKEN`              | Token không hợp lệ                         |
| 401  | 401  | `TOKEN_INVALIDATED`          | Token đã bị vô hiệu hóa (đã logout)       |
| 401  | 401  | `REFRESH_TOKEN_EXPIRED`      | Refresh token hết hạn → cần đăng nhập lại |
| 403  | 403  | `FORBIDDEN`                  | Không có quyền truy cập                    |
| 403  | 403  | `ACCOUNT_DISABLED`           | Tài khoản bị vô hiệu hóa                  |
| 404  | 404  | `USER_NOT_FOUND`             | Không tìm thấy user                        |
| 404  | 404  | `PRODUCT_NOT_FOUND`          | Không tìm thấy sản phẩm                    |
| 404  | 404  | `PRODUCT_VARIANT_NOT_FOUND`  | Không tìm thấy biến thể sản phẩm           |
| 404  | 404  | `CATEGORY_NOT_FOUND`         | Không tìm thấy danh mục                    |
| 404  | 404  | `BRAND_NOT_FOUND`            | Không tìm thấy thương hiệu                 |
| 404  | 404  | `ORDER_NOT_FOUND`            | Không tìm thấy đơn hàng                    |
| 404  | 404  | `ORDER_ITEM_NOT_FOUND`       | Không tìm thấy item trong đơn hàng         |
| 404  | 404  | `CART_ITEM_NOT_FOUND`        | Không tìm thấy item trong giỏ hàng         |
| 409  | 409  | `USER_ALREADY_EXISTS`        | User đã tồn tại                            |
| 409  | 409  | `USERNAME_ALREADY_EXISTS`    | Username đã được sử dụng                   |
| 409  | 409  | `EMAIL_ALREADY_EXISTS`       | Email đã được sử dụng                      |
| 409  | 409  | `CONCURRENT_UPDATE_ERROR`    | Xung đột cập nhật đồng thời                |
| 500  | 500  | `INTERNAL_SERVER_ERROR`      | Lỗi server                                 |
| 500  | 500  | `FILE_UPLOAD_ERROR`          | Lỗi upload file lên Cloudinary             |
| 500  | 500  | `FILE_DELETE_ERROR`          | Lỗi xóa file trên Cloudinary               |

---

# 4. Hướng dẫn xử lý Auth cho Frontend

### Lưu trữ token
```
accessToken   → lưu vào memory hoặc sessionStorage
refreshToken  → lưu vào localStorage hoặc httpOnly cookie
```

### Gắn token vào request
```
Authorization: Bearer <accessToken>
```

### Xử lý token hết hạn (401 TOKEN_EXPIRED)
```
1. Gọi POST /auth/refresh với refreshToken hiện tại
2. Nếu thành công → lưu token mới, retry request gốc
3. Nếu thất bại (REFRESH_TOKEN_EXPIRED) → redirect về trang đăng nhập
```

### Đăng xuất
```
1. Gọi POST /auth/logout với accessToken
2. Xóa toàn bộ token khỏi storage
3. Redirect về trang đăng nhập
```
