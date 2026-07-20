# V1.0.7 - Cập nhật getAllUsers: Bỏ modifiedDate filter, thêm userIdentifier filter, cập nhật keyword filter

**Version**: V1.0.7  
**Date**: 2026-07-21  
**Status**: Active

## API thay đổi

| API | Method | Thay đổi |
|-----|--------|---------|
| `GET /management/users` | GET | Bỏ `modifiedDateFrom`, `modifiedDateTo`; thêm `userIdentifier`; keyword lọc theo fullName, email, phoneNumber (bỏ username) |

## Chi tiết thay đổi

### GET /management/users

**Request Query Parameters** - Các thay đổi:

**Bỏ:**
- `modifiedDateFrom` (LocalDateTime): Lọc theo ngày sửa đổi từ
- `modifiedDateTo` (LocalDateTime): Lọc theo ngày sửa đổi đến

**Thêm:**
- `userIdentifier` (String, optional): Lọc theo ID hoặc username người dùng. Nếu nhập số → lọc theo ID, nếu nhập chuỗi → lọc theo username

**Cập nhật:**
- `keyword` (String, optional): Trước đó lọc theo username, email, fullName. **Hiện tại** lọc theo **fullName, email, phoneNumber** (bỏ username)

**Giữ nguyên:**
- `roleNames` (Set<RoleName>, optional): Lọc theo danh sách vai trò
- `enabled` (Boolean, optional): Lọc theo trạng thái hoạt động
- `createdDateFrom` (LocalDateTime, optional): Lọc theo ngày tạo từ
- `createdDateTo` (LocalDateTime, optional): Lọc theo ngày tạo đến
- `page` (Integer, optional): Số trang (mặc định 0)
- `size` (Integer, optional): Số bản ghi/trang (mặc định 10)
- `sortBy` (String, optional): Trường sắp xếp (mặc định "id")
- `sortType` (String, optional): Kiểu sắp xếp: ASC hoặc DESC (mặc định "ASC")

**Ví dụ request:**

```
GET /management/users?userIdentifier=5&keyword=john&roleNames=CUSTOMER&enabled=true&page=0&size=10&sortBy=createdAt&sortType=DESC
```

hoặc lọc theo username:

```
GET /management/users?userIdentifier=john_doe&keyword=john&page=0&size=10
```

**Response body** - Không thay đổi, vẫn trả về danh sách người dùng với phân trang:

```json
{
  "result": {
    "content": [
      {
        "id": 5,
        "username": "john_doe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "phoneNumber": "0987654321",
        "roles": ["CUSTOMER"],
        "isEnabled": true,
        "createdAt": "2026-07-15T08:30:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0,
    "pageSize": 10,
    "hasNext": false,
    "hasPrevious": false
  },
  "message": "Get all users successfully"
}
```

## Hướng dẫn cập nhật Frontend

### 1. Cập nhật interface/type cho filter form

**Trước:**
```typescript
interface UserFilterParams {
  keyword?: string;
  roleNames?: string[];
  enabled?: boolean;
  createdDateFrom?: string;
  createdDateTo?: string;
  modifiedDateFrom?: string;  // BỎ
  modifiedDateTo?: string;    // BỎ
  page?: number;
  size?: number;
  sortBy?: string;
  sortType?: string;
}
```

**Sau:**
```typescript
interface UserFilterParams {
  userIdentifier?: string;     // THÊM - nhập ID hoặc username
  keyword?: string;            // LỌC: fullName, email, phoneNumber (bỏ username)
  roleNames?: string[];
  enabled?: boolean;
  createdDateFrom?: string;
  createdDateTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortType?: string;
}
```

### 2. Cập nhật form/component tìm kiếm người dùng

- **Bỏ** 2 input lọc theo ngày sửa đổi (`modifiedDateFrom`, `modifiedDateTo`)
- **Thêm** 1 input mới để lọc theo ID hoặc username người dùng (kiểu: string, placeholder: "Nhập ID hoặc username")
- **Cập nhật** label/placeholder của `keyword` từ "Tìm theo username, email, họ tên" → "Tìm theo họ tên, email, số điện thoại"

### 3. Cập nhật API call

**Trước:**
```typescript
const response = await fetch(
  `/management/users?keyword=${keyword}&modifiedDateFrom=${modifiedDateFrom}&modifiedDateTo=${modifiedDateTo}&page=${page}&size=${size}`
);
```

**Sau:**
```typescript
const response = await fetch(
  `/management/users?userIdentifier=${userIdentifier}&keyword=${keyword}&page=${page}&size=${size}`
);
```

### 4. Cập nhật validation/validation rules

- Input `userIdentifier` là string, có thể là số (ID) hoặc chuỗi (username)
- Xóa validation cho `modifiedDateFrom`, `modifiedDateTo`
- Giữ validation cho các filter khác

## Breaking Change

**Có** - Loại bỏ `modifiedDateFrom`, `modifiedDateTo` có thể gây lỗi nếu frontend vẫn gửi các tham số này:
- Các tham số sẽ bị bỏ qua (backend sẽ không dùng)
- Client cũ không gặp lỗi HTTP, nhưng kết quả tìm kiếm có thể không đúng nếu vẫn phụ thuộc vào 2 tham số này

## Ảnh hưởng

- Màn hình quản lý người dùng: Loại bỏ 2 input lọc theo ngày sửa đổi, thêm 1 input lọc theo ID/username
- Chức năng tìm kiếm: Hiệu suất có thể cải thiện vì loại bỏ điều kiện lọc theo ngày sửa đổi
- UX: Đơn giản hóa form tìm kiếm, người dùng có thể lọc nhanh theo ID/username hoặc thông tin cơ bản (họ tên, email, SĐT)
