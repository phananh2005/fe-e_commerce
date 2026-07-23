# V1.3.1 - Sửa lỗi sort parameter trong API danh sách user

**Ngày tạo:** 2026-07-23
**Loại thay đổi:** Bug fix
**Breaking Change:** Không

## Mô tả

Sửa lỗi `PropertyReferenceException: No property 'fullName' found for type 'User'` khi gọi API `GET /management/users` với parameter `sortBy=fullName` hoặc `sortBy=username`.

## Nguyên nhân

Entity `User` sử dụng `@Embedded` cho `UserInfo` và `UserCredentials`, nên các property `fullName`, `username`, `email`, `phoneNumber`, `address`, `enabled` không tồn tại trực tiếp trên `User` mà nằm trong embedded objects.

Spring Data JPA không thể resolve `fullName` thành `info.fullName` tự động khi tạo `Sort`.

## Thay đổi kỹ thuật

### API ảnh hưởng

| API | Thay đổi |
|-----|----------|
| `GET /management/users` | Sửa lỗi sort parameter mapping |

### Sort parameter mapping mới

Backend đã thêm mapper để chuyển đổi sort parameter từ client thành property path đúng:

| sortBy (FE gửi) | Backend mapping |
|-----------------|-----------------|
| `fullName` | `info.fullName` |
| `username` | `credentials.username` |
| `email` | `info.email` |
| `phoneNumber` | `info.phoneNumber` |
| `address` | `info.address` |
| `enabled` | `credentials.isEnabled` |
| Các giá trị khác (như `createdAt`, `id`, `uuid`) | Giữ nguyên |

### Hành vi của API

**Request:**
```
GET /management/users?sortBy=fullName&sortType=asc
```

**Kết quả:** Sắp xếp theo họ tên tăng dần (hoạt động bình thường, không còn lỗi 500).

**Request:**
```
GET /management/users?sortBy=username&sortType=desc
```

**Kết quả:** Sắp xếp theo username giảm dần.

## Hướng dẫn cập nhật Frontend

### Không cần thay đổi code

Frontend **không cần thay đổi gì**. Các parameter `sortBy` hiện tại vẫn hoạt động bình thường:
- `fullName` - sắp xếp theo họ tên
- `username` - sắp xếp theo username
- `email` - sắp xếp theo email
- `phoneNumber` - sắp xếp theo số điện thoại
- `address` - sắp xếp theo địa chỉ
- `enabled` - sắp xếp theo trạng thái
- `createdAt` (default) - sắp xếp theo ngày tạo

### Test lại

1. Gọi API `GET /management/users?sortBy=fullName` và xác nhận không còn lỗi 500
2. Gọi API `GET /management/users?sortBy=username` và xác nhận kết quả sắp xếp đúng
3. Test các sort parameter khác để đảm bảo không bị regression

## Lưu ý

- Đây là bug fix, không có breaking change
- Nếu FE đang có workaround hoặc error handling cho bug này, có thể bỏ qua sau khi cập nhật
