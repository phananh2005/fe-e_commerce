# V1.0.4 — Thêm trường `status` và `modifiedAt` vào response của GET /management/order/search

- **Version:** V1.0.4
- **Ngày tạo:** 2026-07-20
- **Loại thay đổi:** Cập nhật API
- **Breaking change:** Không

## API thay đổi

### GET `/management/order/search`

#### Response thay đổi

Thêm các trường mới vào object response:

| Trường | Kiểu | Mô tả |
|---|---|---|
| `status` | string | Trạng thái đơn hàng: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`. |
| `modifiedAt` | ISO 8601 datetime | Ngày giờ cập nhật lần cuối của đơn hàng. |

#### Response mới

```json
{
  "result": {
    "content": [
      {
        "orderId": 1,
        "userId": 123,
        "username": "john_doe",
        "totalPrice": 500000,
        "status": "CONFIRMED",
        "createdAt": "2026-07-20T10:30:00",
        "modifiedAt": "2026-07-20T15:45:00",
        "items": [
          {
            "productId": 1,
            "productName": "Áo thun nam",
            "skuCode": "SKU001",
            "quantity": 2,
            "price": 250000,
            "variantImageUrl": "https://example.com/image.jpg"
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 100,
      "totalPages": 10
    }
  },
  "message": "Get orders successfully"
}
```

## Hướng dẫn cập nhật FE

1. **Thêm cột hiển thị status:**
   - Thêm cột "Trạng thái" trong bảng danh sách đơn hàng
   - Hiển thị giá trị từ trường `status` trong response
   - Format hiển thị: Dùng badge/label với màu sắc phù hợp cho từng trạng thái:
     - `PENDING` → Màu vàng (Chờ xác nhận)
     - `CONFIRMED` → Màu xanh dương (Đã xác nhận)
     - `SHIPPING` → Màu cam (Đang giao hàng)
     - `DELIVERED` → Màu xanh lục (Đã giao)
     - `CANCELLED` → Màu đỏ (Đã hủy)
     - `RETURNED` → Màu tím (Trả hàng)

2. **Sử dụng trường modifiedAt:**
   - Có thể hiển thị cột "Cập nhật lần cuối" để biết đơn hàng đã được cập nhật lần cuối khi nào
   - Sử dụng cho sắp xếp hoặc lọc nếu cần

3. **Cập nhật API call:**
   - Không cần thay đổi tham số request
   - Tự động sử dụng các trường `status` và `modifiedAt` từ response khi được trả về

4. **Xử lý response:**
   - Lấy dữ liệu từ các trường `status` và `modifiedAt` trong mỗi object đơn hàng
   - Render status trên UI theo format màu sắc đã định nghĩa
   - Render modifiedAt nếu cần hiển thị thời gian cập nhật

## Ảnh hưởng FE

- Màn hình/module quản lý đơn hàng (Order Management).
- Không có breaking change — chỉ thêm các trường mới, request/response structure vẫn tương thích.
- Cần thêm cột status vào bảng danh sách đơn hàng để hiển thị trạng thái.
- Có thể thêm cột modifiedAt nếu muốn hiển thị thời gian cập nhật.

## Ghi chú

- Trường `status` được thêm để FE có thể hiển thị trạng thái đơn hàng trực tiếp mà không cần call thêm API chi tiết.
- Trường `modifiedAt` được thêm để FE có thể biết đơn hàng được cập nhật lần cuối khi nào.
- Giá trị `status` được lấy từ domain model `Order.status` (enum `OrderStatus`).
- Giá trị `modifiedAt` được lấy từ `Order.modifiedAt` (BaseEntity field).

