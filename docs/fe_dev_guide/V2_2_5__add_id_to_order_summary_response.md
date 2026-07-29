---
version: V2_2_5
date: 2026-07-29
description: "Add id to OrderSummaryResponse"
breaking_change: false
---

# V2.2.5: Add id to OrderSummaryResponse

## Thay đổi
- Thêm trường `id` vào response của API lấy danh sách đơn hàng của tôi (`GET /orders/my-orders`).

## Chi tiết
**API**: `GET /orders/my-orders`

**Response (Thêm mới)**:
```json
{
  "result": [
    {
      "id": 1,
      "orderUuid": "...",
      "totalPrice": 30000.0,
      "status": "PENDING",
      "items": [...]
    }
  ]
}
```

## Hướng dẫn cho FE
- FE có thể sử dụng trường `id` mới này để gọi API chi tiết đơn hàng (`GET /orders/my-orders/{orderId}`).
- Đây là ID nội bộ của đơn hàng.

## Breaking Change
- **Không**: Chỉ thêm trường mới, không ảnh hưởng tới code cũ.
