# User Management API

Base URL: `/api` (hoặc context path của ứng dụng)

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

- `code`: `1000` = thành công. Các mã lỗi khác xem `ErrorCode`.
- `result`: `null` nếu không có dữ liệu trả về (204 No Content).

---

## Enum: RoleName

```
ROLE_ADMIN
ROLE_STAFF
ROLE_CUSTOMER
```

---

## 1. Customer – Tài khoản cá nhân

> Yêu cầu: đã đăng nhập (Bearer token)

### 1.1 Lấy thông tin cá nhân

```
GET /users/my-info
```

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get user info successfully",
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

---

### 1.2 Cập nhật thông tin cá nhân

```
PATCH /users/update-info
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "0901234567",
  "address": "123 Đường ABC, TP.HCM",
  "email": "john@example.com"
}
```

| Field         | Type   | Bắt buộc | Ghi chú                  |
|---------------|--------|----------|--------------------------|
| `fullName`    | string | ✅        |                          |
| `phoneNumber` | string | ✅        |                          |
| `address`     | string | ❌        |                          |
| `email`       | string | ❌        |                          |

**Response 204:** No Content

---

### 1.3 Đổi mật khẩu

```
PATCH /users/change-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "oldPassword": "matkhaucu123",
  "newPassword": "matkhaumoi456"
}
```

| Field         | Type   | Bắt buộc |
|---------------|--------|----------|
| `oldPassword` | string | ✅        |
| `newPassword` | string | ✅        |

**Response 204:** No Content

---

## 2. Staff – Quản lý khách hàng

> Yêu cầu: role `ROLE_STAFF` hoặc `ROLE_ADMIN`

### 2.1 Lấy thông tin khách hàng theo ID

```
GET /staff/users/customer/info/{id}
```

| Param | Type | Mô tả       |
|-------|------|-------------|
| `id`  | Long | ID người dùng |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get customer info successfully",
  "result": {
    "id": 5,
    "username": "customer01",
    "email": "customer01@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "address": "456 Đường XYZ, Hà Nội",
    "roles": ["ROLE_CUSTOMER"],
    "isEnabled": true
  }
}
```

---

## 3. Admin – Quản trị người dùng

> Yêu cầu: role `ROLE_ADMIN`

### 3.1 Lấy danh sách người dùng (có lọc & phân trang)

```
GET /admin/users
```

**Query Parameters:**

| Param              | Type            | Bắt buộc | Mô tả                                      |
|--------------------|-----------------|----------|--------------------------------------------|
| `keyword`          | string          | ❌        | Tìm theo username / email / fullName       |
| `roleNames`        | RoleName[]      | ❌        | Lọc theo role, VD: `roleNames=ROLE_CUSTOMER&roleNames=ROLE_STAFF` |
| `enabled`          | boolean         | ❌        | `true` / `false`                           |
| `createdDateFrom`  | ISO datetime    | ❌        | VD: `2024-01-01T00:00:00`                  |
| `createdDateTo`    | ISO datetime    | ❌        |                                            |
| `modifiedDateFrom` | ISO datetime    | ❌        |                                            |
| `modifiedDateTo`   | ISO datetime    | ❌        |                                            |
| `page`             | int (≥ 0)       | ❌        | Mặc định: `0`                              |
| `size`             | int (≥ 1)       | ❌        | Mặc định: `10`                             |
| `sortBy`           | string          | ❌        | Tên field cần sort, VD: `createdAt`        |
| `sortType`         | string          | ❌        | `asc` hoặc `desc`                          |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get all users successfully",
  "result": {
    "content": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "Admin User",
        "phoneNumber": "0900000001",
        "address": null,
        "roles": ["ROLE_ADMIN"],
        "isEnabled": true,
        "createdAt": "2024-01-01T08:00:00",
        "createdBy": "system",
        "modifiedAt": "2024-06-01T10:00:00",
        "modifiedBy": "admin"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10
    },
    "totalElements": 50,
    "totalPages": 5,
    "last": false,
    "first": true
  }
}
```

---

### 3.2 Lấy thông tin chi tiết người dùng theo ID

```
GET /admin/users/info/{id}
```

| Param | Type | Mô tả         |
|-------|------|---------------|
| `id`  | Long | ID người dùng |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get user info successfully",
  "result": {
    "id": 5,
    "username": "customer01",
    "email": "customer01@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "address": "456 Đường XYZ, Hà Nội",
    "roles": ["ROLE_CUSTOMER"],
    "isEnabled": true
  }
}
```

---

### 3.3 Cập nhật vai trò người dùng

```
PATCH /admin/users/update-role
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 5,
  "roleNames": ["ROLE_STAFF"]
}
```

| Field       | Type       | Bắt buộc | Ghi chú                        |
|-------------|------------|----------|--------------------------------|
| `userId`    | Long       | ✅        |                                |
| `roleNames` | RoleName[] | ✅        | Không được rỗng. Ghi đè toàn bộ role hiện tại |

**Response 204:** No Content

---

### 3.4 Cập nhật trạng thái người dùng

```
PATCH /admin/users/{id}/{status}
```

| Param    | Type   | Mô tả                                  |
|----------|--------|----------------------------------------|
| `id`     | Long   | ID người dùng                          |
| `status` | string | Trạng thái mới, VD: `active` / `inactive` (xem logic backend) |

**Response 204:** No Content

---

## Lỗi phổ biến

| HTTP Status | Ý nghĩa                                      |
|-------------|----------------------------------------------|
| 400         | Dữ liệu request không hợp lệ (validation)    |
| 401         | Chưa xác thực (thiếu / sai token)            |
| 403         | Không có quyền truy cập                      |
| 404         | Không tìm thấy người dùng                    |

**Ví dụ response lỗi:**
```json
{
  "code": 4001,
  "message": "User not found"
}
```
