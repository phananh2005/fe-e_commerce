# V1.0.6 - Thêm email và createdAt vào UserSummaryForManagementResponse

**Version**: V1.0.6  
**Date**: 2026-07-20  
**Status**: Active

## API thay đổi

| API | Method | Thay đổi |
|-----|--------|---------|
| `GET /management/users/info/{id}` | GET | Thêm fields `email`, `createdAt` vào response |

## Chi tiết thay đổi

### GET /management/users/info/{id}

**Response body** - Thêm fields mới:

```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phoneNumber": "0123456789",
  "roles": ["CUSTOMER"],
  "isEnabled": true,
  "createdAt": "2026-07-20T10:30:00"
}
```

**Fields mới**:
- `email` (String): Địa chỉ email của người dùng
- `createdAt` (LocalDateTime): Thời gian tạo tài khoản (ISO 8601 format)

## Hướng dẫn cập nhật Frontend

1. Cập nhật kiểu dữ liệu `UserSummaryForManagement`:
   ```typescript
   interface UserSummaryForManagement {
     id: number;
     username: string;
     email: string;          // NEW
     fullName: string;
     phoneNumber: string;
     roles: string[];
     isEnabled: boolean;
     createdAt: string;      // NEW - ISO 8601 datetime
   }
   ```

2. Cập nhật component/page hiển thị thông tin người dùng để hiển thị email và ngày tạo nếu cần

3. Cập nhật form/modal chỉnh sửa thông tin người dùng nếu có

## Breaking Change

**Không** - Fields `email`, `createdAt` là optional trong logic xử lý (thêm mới không gây lỗi với client cũ)

## Ảnh hưởng

- Màn hình quản lý người dùng có thể hiển thị email và ngày tạo tài khoản
- Form chỉnh sửa thông tin người dùng có thể cập nhật email
