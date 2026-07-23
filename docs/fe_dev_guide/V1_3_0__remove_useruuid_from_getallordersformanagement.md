# V1.3.0 - Bỏ userUuid khỏi response getAllOrdersForManagement

**Version:** V1.3.0  
**Ngày tạo:** 2026-07-23  
**Breaking Change:** Có

## Tóm tắt

API `GET /management/order/search` của `getAllOrdersForManagement` không còn trả về field `userUuid` trong response `ManagementOrderResponse`.

FE cần bỏ toàn bộ logic đọc, hiển thị, và map field `userUuid` ở màn hình quản lý đơn hàng.

## API thay đổi

### `GET /management/order/search` - Danh sách đơn hàng (Management)
- **Loại thay đổi:** Cập nhật response
- **Field bị xóa:** `userUuid`

#### Response cũ
```json
{
  "code": 1000,
  "message": "Get orders successfully",
  "result": {
    "content": [
      {
        "orderId": 5,
        "userId": 3,
        "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "userUuid": "a47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "nguyen_van_a",
        "totalPrice": 500000,
        "status": "PENDING",
        "createdAt": "2026-07-23T08:00:00",
        "modifiedAt": "2026-07-23T10:00:00",
        "items": [...]
      }
    ]
  }
}
```

#### Response mới
```json
{
  "code": 1000,
  "message": "Get orders successfully",
  "result": {
    "content": [
      {
        "orderId": 5,
        "userId": 3,
        "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "nguyen_van_a",
        "totalPrice": 500000,
        "status": "PENDING",
        "createdAt": "2026-07-23T08:00:00",
        "modifiedAt": "2026-07-23T10:00:00",
        "items": [...]
      }
    ]
  }
}
```

## Chi tiết thay đổi

| Field | Kiểu | Thay đổi | Ghi chú |
|-------|------|---------|--------|
| `userUuid` | String | ❌ XÓA | Không còn được trả về trong danh sách đơn hàng management |
| `userId` | Long | ➡️ GIỮ NGUYÊN | Vẫn dùng cho backend/FE nếu cần internal ID |
| `username` | String | ➡️ GIỮ NGUYÊN | Vẫn dùng để hiển thị |

## Hướng dẫn Frontend cập nhật

### 1. Cập nhật interface
- Xóa `userUuid` khỏi `ManagementOrderResponse`
- Không map field này trong any mapper/store/cache

### 2. Cập nhật UI
- Bỏ mọi chỗ hiển thị `userUuid` nếu có
- Nếu đang dùng `userUuid` làm key/identifier trên danh sách đơn hàng thì chuyển sang `orderUuid` hoặc `orderId`

### 3. Cập nhật logic liên quan
- Kiểm tra các component, table column, tooltip, modal, export, filter, và test đang đọc `userUuid`
- Loại bỏ các fallback liên quan đến `userUuid`

### 4. Test cases cần kiểm tra
- [ ] Response danh sách đơn hàng không còn `userUuid`
- [ ] UI không lỗi khi `userUuid` bị xóa
- [ ] Không còn reference nào tới `userUuid` trong management order list
- [ ] Các field còn lại vẫn hiển thị bình thường

## Ảnh hưởng

### Màn hình bị ảnh hưởng
- Trang danh sách đơn hàng (Management)
- Modal/Dialog liên quan đến danh sách đơn hàng management

### Module bị ảnh hưởng
- Order management

## Lưu ý quan trọng

- Đây là breaking change vì response contract bị thay đổi
- FE phải loại bỏ mọi phụ thuộc vào `userUuid` trước khi deploy
- Nếu cần định danh người dùng trong UI, dùng `userId` hoặc `username` tùy mục đích
