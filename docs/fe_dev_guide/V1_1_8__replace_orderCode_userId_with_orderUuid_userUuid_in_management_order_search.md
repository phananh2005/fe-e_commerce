# V1_1_8: Thay đổi bộ lọc API Management Order Search

**Version**: V1_1_8  
**Ngày tạo**: 2026-07-22  
**Breaking Change**: Có

## Tóm tắt

API `getAllOrdersForManagement` thay đổi cách lọc đơn hàng:
- Bỏ bộ lọc `orderCode` (ID), thay thế bằng `orderUuid` (UUID)
- Bỏ bộ lọc `userId` (ID), thay thế bằng `userUuid` (UUID)

Mục đích: Sử dụng UUID cho tất cả các bộ lọc thay vì ID để consistency và security.

## Chi tiết thay đổi

### API Endpoint
- **Endpoint**: `GET /management/order/search`
- **Method**: GET
- **Type**: Management API

### Request DTO - OrderFilterRequest

#### Thay đổi
| Field | Kiểu | Thay đổi | Ghi chú |
|-------|------|---------|--------|
| `orderCode` | String | ❌ XÓA | Không còn dùng |
| `orderUuid` | String | ✅ THÊM MỚI | Lọc theo UUID của đơn hàng |
| `userId` | Long | ❌ XÓA | Không còn dùng |
| `userUuid` | String | ✅ THÊM MỚI | Lọc theo UUID của khách hàng |
| `createdFromDate` | LocalDateTime | ➡️ GIỮ NGUYÊN | Như cũ |
| `createdToDate` | LocalDateTime | ➡️ GIỮ NGUYÊN | Như cũ |
| `status` | OrderStatus | ➡️ GIỮ NGUYÊN | Như cũ |
| `page` | Integer | ➡️ GIỮ NGUYÊN | Như cũ |
| `size` | Integer | ➡️ GIỮ NGUYÊN | Như cũ |
| `sortBy` | String | ➡️ GIỮ NGUYÊN | Như cũ |
| `sortType` | String | ➡️ GIỮ NGUYÊN | Như cũ |

#### Request mẫu (cũ - không dùng)
```json
{
  "orderCode": "123",
  "userId": 456,
  "createdFromDate": "2026-07-01T00:00:00",
  "createdToDate": "2026-07-31T23:59:59",
  "status": "PENDING",
  "page": 0,
  "size": 10,
  "sortBy": "createdAt",
  "sortType": "DESC"
}
```

#### Request mẫu (mới - dùng)
```json
{
  "orderUuid": "123e4567-e89b-12d3-a456-426614174000",
  "userUuid": "123e4567-e89b-12d3-a456-426614174001",
  "createdFromDate": "2026-07-01T00:00:00",
  "createdToDate": "2026-07-31T23:59:59",
  "status": "PENDING",
  "page": 0,
  "size": 10,
  "sortBy": "createdAt",
  "sortType": "DESC"
}
```

### Response
- **Type**: `Page<ManagementOrderResponse>`
- **Thay đổi**: Không có thay đổi (response vẫn giữ nguyên)

## Ảnh hưởng tới Frontend

### Màn hình/Module bị ảnh hưởng
- Trang Quản lý đơn hàng (Management Orders)
- Form lọc tìm kiếm đơn hàng

### Action cần thực hiện

1. **Cập nhật request model**
   - Thay `orderCode` → `orderUuid` trong form filter
   - Thay `userId` → `userUuid` trong form filter
   - Đảm bảo field được optional (có thể null)

2. **Cập nhật form input**
   - Input cho `orderUuid`: Text field nhận UUID (định dạng: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - Input cho `userUuid`: Text field nhận UUID hoặc có thể là dropdown/autocomplete (tìm user theo UUID)

3. **Cập nhật API call**
   - Gửi `orderUuid` thay vì `orderCode`
   - Gửi `userUuid` thay vì `userId`

4. **Validation**
   - Validate format UUID (nếu người dùng nhập)
   - Cho phép field này optional (có thể không nhập để lọc)

5. **Test cases**
   - Lọc theo `orderUuid`: Kiểm tra kết quả chính xác
   - Lọc theo `userUuid`: Kiểm tra kết quả chính xác
   - Lọc kết hợp: `orderUuid` + `userUuid` + `status` + date range
   - Lọc không có filter nào: Phải return tất cả đơn hàng

## Thay đổi Backend

### UserService
- Thêm method `getIdByUserUuid(String userUuid)` để convert UUID sang ID

### OrderFilterRequest
- Bỏ field `orderCode`
- Thêm field `orderUuid`
- Bỏ field `userId`
- Thêm field `userUuid`

### OrderSearchQuery
- Bỏ field `orderCode`
- Thêm field `orderUuid`
- Bỏ field `userId`
- Thêm field `userUuid` + `userId` (userId dùng nội bộ)

### OrderSearchSpecification
- Rename method `hasOrderCode` → `hasOrderUuid`
- Rename method `hasUserId` → Giữ nguyên, thêm method `hasUserId` cho xử lý internal

### OrderServiceImpl
- Cập nhật `getAllOrders` để convert `userUuid` sang `userId` trước khi query

## Lưu ý quan trọng

- **Breaking Change**: API cũ không còn chấp nhận `orderCode` và `userId`
- Nếu FE đang dùng `orderCode` hoặc `userId`, phải update ngay
- UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (36 ký tự)
- Nếu gửi `userUuid` không tồn tại, API sẽ return empty page (không error)

## Ngày release
2026-07-22
