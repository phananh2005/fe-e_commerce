# V1_1_9: Cập nhật getAllUsers - Đổi keyword→userInfo và thêm field id

**Version**: V1_1_9  
**Ngày tạo**: 2026-07-22  
**Breaking Change**: Có (request parameter thay đổi)

## Tóm tắt

API `GET /management/users` có 2 thay đổi:
1. Request: Đổi `keyword` → `userInfo` (lọc theo fullName, email, phoneNumber)
2. Response: Thêm field `id` (Long) để dùng cho các API operations cần id

## Chi tiết thay đổi

### API Endpoint
- **Endpoint**: `GET /management/users`
- **Method**: GET
- **Type**: Management API

### Request DTO - UserQueryRequest

#### Thay đổi
| Field | Kiểu | Thay đổi | Ghi chú |
|-------|------|---------|--------|
| `keyword` | String | ❌ XÓA | Không còn dùng |
| `userInfo` | String | ✅ THÊM MỚI | Lọc theo fullName, email, phoneNumber |
| `userIdentifier` | String | ➡️ GIỮ NGUYÊN | Lọc theo ID hoặc username |
| `roleNames` | Set<RoleName> | ➡️ GIỮ NGUYÊN | Lọc theo role |
| `enabled` | Boolean | ➡️ GIỮ NGUYÊN | Lọc theo trạng thái hoạt động |
| `createdDateFrom` | LocalDateTime | ➡️ GIỮ NGUYÊN | Lọc theo ngày tạo từ |
| `createdDateTo` | LocalDateTime | ➡️ GIỮ NGUYÊN | Lọc theo ngày tạo đến |
| `page` | Integer | ➡️ GIỮ NGUYÊN | Số trang |
| `size` | Integer | ➡️ GIỮ NGUYÊN | Kích thước trang |
| `sortBy` | String | ➡️ GIỮ NGUYÊN | Trường sắp xếp |
| `sortType` | String | ➡️ GIỮ NGUYÊN | Kiểu sắp xếp |

#### Request mẫu (cũ - dùng keyword)
```json
{
  "keyword": "john",
  "userIdentifier": "123",
  "roleNames": ["ROLE_CUSTOMER"],
  "enabled": true,
  "page": 0,
  "size": 10
}
```

#### Request mẫu (mới - dùng userInfo)
```json
{
  "userInfo": "john",
  "userIdentifier": "123",
  "roleNames": ["ROLE_CUSTOMER"],
  "enabled": true,
  "page": 0,
  "size": 10
}
```

### Response DTO - UserSummaryForManagementResponse

#### Thêm field
| Field | Kiểu | Ghi chú |
|-------|------|--------|
| `id` | Long | ✅ THÊM MỚI - **CHỈ dùng cho API operations, không hiển thị** |

#### Response mẫu (cũ - không có id)
```json
{
  "result": {
    "content": [
      {
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john_doe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "phoneNumber": "0912345678",
        "roles": ["ROLE_CUSTOMER"],
        "isEnabled": true,
        "createdAt": "2026-07-15T08:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 100,
      "totalPages": 10
    }
  }
}
```

#### Response mẫu (mới - có id)
```json
{
  "result": {
    "content": [
      {
        "id": 1,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john_doe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "phoneNumber": "0912345678",
        "roles": ["ROLE_CUSTOMER"],
        "isEnabled": true,
        "createdAt": "2026-07-15T08:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 100,
      "totalPages": 10
    }
  }
}
```

## Ảnh hưởng tới Frontend

### Màn hình/Module bị ảnh hưởng
- Trang Quản lý người dùng (User Management)
- Bất kỳ chỗ nào dùng `getAllUsers` API

### Action cần thực hiện

1. **Cập nhật request parameter**
   - Thay `keyword` → `userInfo` trong form filter
   - Giữ nguyên các parameter khác

2. **Cập nhật response model**
   - Thêm field `id` (Long) vào type definition
   - **QUAN TRỌNG**: `id` chỉ dùng cho các API operations (update role, update status), không hiển thị trên UI

3. **Update type definition**
   ```typescript
   interface UserSummaryForManagement {
     id: number;                    // THÊM - chỉ dùng cho API calls, không hiển thị
     uuid: string;
     username: string;
     email: string;
     fullName: string;
     phoneNumber: string;
     roles: string[];
     isEnabled: boolean;
     createdAt: string;
   }
   ```

4. **Cập nhật form filter**
   ```typescript
   // Cũ
   const params = {
     keyword: searchTerm,
     userIdentifier: userId,
     // ...
   };
   
   // Mới
   const params = {
     userInfo: searchTerm,
     userIdentifier: userId,
     // ...
   };
   ```

5. **Sử dụng id cho API operations (không hiển thị)**
   ```typescript
   // Sử dụng id cho các API operations
   axios.patch(`/management/users/update-role`, {
     userId: user.id,  // Lấy từ field id, không hiển thị
     roleNames: ["ROLE_DELIVERY_STAFF"]
   });
   
   // Hiển thị trên UI dùng uuid hoặc username
   <div>
     <p>Username: {user.username}</p>
     <p>Email: {user.email}</p>
   </div>
   ```

## Lưu ý quan trọng

- **Breaking Change**: Request parameter `keyword` được thay bằng `userInfo` - phải update API call
- Field `id` **KHÔNG** dùng để hiển thị trên UI, chỉ dùng cho API operations (update role, update status, v.v.)
- UUID format vẫn giữ nguyên: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ID format: Long numeric value
- Khi hiển thị thông tin user trên UI, dùng `uuid`, `username`, `email`, `fullName` - không dùng `id`

## Ngày release
2026-07-22

## Ghi chú
- Request parameter thay đổi từ `keyword` → `userInfo`
- Backend thêm field `id` vào response cho dễ dàng sử dụng trong API calls
- **QUAN TRỌNG**: `id` là internal field, chỉ dùng cho backend operations, không hiển thị trên giao diện người dùng
