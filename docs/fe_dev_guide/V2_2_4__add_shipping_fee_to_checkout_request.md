---
version: V2_2_4
date: 2026-07-28
description: "Add shippingFee to checkout API"
breaking_change: true
---

# V2.2.4: Add shippingFee to checkout API

## Thay đổi
- Thêm trường `shippingFee` vào request của API Checkout (`POST /orders/checkout` hoặc tương đương).

## Chi tiết
**API**: `POST /orders/checkout` (Hoặc endpoint tương ứng gọi tới `checkout`)

**Request Body (Thêm mới)**:
```json
{
  ...
  "shippingFee": 30000.00
}
```

## Hướng dẫn cho FE
- Khi gọi API thanh toán/tạo đơn, FE cần truyền thêm trường `shippingFee` (kiểu số, bắt buộc) vào payload.

## Breaking Change
- **Có**: Nếu FE không truyền `shippingFee`, API sẽ trả về lỗi validation `Shipping fee is required`.
