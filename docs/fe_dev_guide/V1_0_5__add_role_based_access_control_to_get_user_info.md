# V1.0.5 — Thêm xác thực quyền dựa trên role cho GET /management/users/info/{id}

- **Version:** V1.0.5
- **Ngày tạo:** 2026-07-20
- **Loại thay đổi:** Cập nhật API
- **Breaking change:** Không

## API thay đổi

### GET `/management/users/info/{id}`

#### Xác thực quyền

API này bây giờ thêm kiểm tra quyền dựa trên role của người dùng hiện tại:

- **ROLE_SUPER_ADMIN**: có thể xem thông tin của bất kỳ user nào
- **ROLE_STORE_ADMIN**: chỉ có thể xem thông tin của user có role `ROLE_DELIVERY_STAFF` hoặc `ROLE_CUSTOMER`
- **Role khác** (ROLE_DELIVERY_STAFF, ROLE_CUSTOMER): không có quyền truy cập → **403 FORBIDDEN**

#### Behavior

```
GET /management/users/info/{id}
Authorization: Bearer <accessToken>
```

| Trường hợp | Kết quả | Status Code |
|-----------|--------|-----------|
| User hiện tại là SUPER_ADMIN | Trả về thông tin user | 200 OK |
| User hiện tại là STORE_ADMIN, user target có role DELIVERY_STAFF/CUSTOMER | Trả về thông tin user | 200 OK |
| User hiện tại là STORE_ADMIN, user target có role SUPER_ADMIN/STORE_ADMIN | Lỗi không có quyền | 403 FORBIDDEN |
| User hiện tại là DELIVERY_STAFF hoặc CUSTOMER | Lỗi không có quyền | 403 FORBIDDEN |
| User không tồn tại | Lỗi không tìm thấy | 404 NOT_FOUND |

#### Response không thay đổi

Response vẫn giữ nguyên khi thành công (200 OK):

```json
{
  "code": 1000,
  "result": {
    "id": 5,
    "username": "staff01",
    "email": "staff@example.com",
    "fullName": "Staff User",
    "phoneNumber": "0901234567",
    "address": "123 Đường ABC",
    "roles": ["ROLE_DELIVERY_STAFF"],
    "isEnabled": true,
    "createdAt": "2026-07-15T10:30:00",
    "createdBy": "admin",
    "modifiedAt": "2026-07-20T15:45:00",
    "modifiedBy": "admin"
  }
}
```

#### Error Response

Khi người dùng không có quyền:

```json
{
  "code": 403,
  "message": "FORBIDDEN",
  "result": null
}
```

## Hướng dẫn cập nhật FE

1. **Kiểm tra quyền trước khi gọi API:**
   - Trước khi gọi `GET /management/users/info/{id}`, check role của người dùng hiện tại
   - Nếu role không phải SUPER_ADMIN hoặc STORE_ADMIN, không hiển thị chức năng xem chi tiết user
   - Nếu là STORE_ADMIN, chỉ cho phép xem chi tiết user có role DELIVERY_STAFF hoặc CUSTOMER (kiểm tra ở danh sách user)

2. **Xử lý error 403:**
   - Khi nhận lỗi 403 FORBIDDEN từ API này, hiển thị thông báo: "Bạn không có quyền xem thông tin người dùng này"
   - Không cho phép retry, quay lại danh sách user

3. **Cập nhật UI:**
   - Trong danh sách user, chỉ hiển thị nút "Xem chi tiết" cho các user có role DELIVERY_STAFF hoặc CUSTOMER nếu người dùng hiện tại là STORE_ADMIN
   - SUPER_ADMIN vẫn có thể xem chi tiết tất cả user

4. **Không cần thay đổi request:**
   - Cách gọi API vẫn giống cũ: `GET /management/users/info/{id}`
   - Chỉ cần xử lý error 403 thêm vào

## Ảnh hưởng FE

- Màn hình/module quản lý người dùng (User Management)
- Không có breaking change — chỉ thêm xác thực quyền phía backend
- Cần kiểm tra error 403 và xử lý trong UI
- Cần ẩn/vô hiệu hóa nút "Xem chi tiết" cho các user không có quyền xem

## Ghi chú

- Xác thực quyền thực hiện phía backend, FE không cần gửi thêm tham số nào
- Quyền này áp dụng tương tự với các API quản lý user khác (update role, update status, v.v.)
- STORE_ADMIN không thể xem chi tiết user có role SUPER_ADMIN hoặc STORE_ADMIN (chính họ)
