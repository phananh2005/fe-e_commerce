---
version: V2.2.6
date: 2026-07-29
summary: Add cartItemUuid to CartItemResponse
breaking_change: false
---

# V2.2.6: Thêm cartItemUuid vào CartItemResponse

## Danh sách API thay đổi
- `GET /cart-item/my-cart`

## Chi tiết thay đổi

Response `CartItemResponse` được bổ sung thêm trường `cartItemUuid` (kiểu String) để định danh sản phẩm trong giỏ hàng thông qua UUID.

### Response mẫu sau khi cập nhật:

```json
{
  "cartItemId": 1,
  "cartItemUuid": "550e8400-e29b-41d4-a716-446655440000",
  "productUuid": "123e4567-e89b-12d3-a456-426614174000",
  "productName": "Product A",
  "productStatus": "ACTIVE",
  "currentVariantId": "10",
  "variantSkuCode": "SKU-A",
  "variantImageUrl": "http...",
  "variantPrice": 100000,
  "stockQuantity": 50,
  "cartItemQuantity": 2
}
```

## Hướng dẫn FE cập nhật
- Frontend có thể bắt đầu sử dụng trường `cartItemUuid` để định danh Cart Item.
- Hiện tại không có breaking change. Các API khác liên quan đến Cart (như Update hay Delete) tạm thời vẫn nhận tham số cũ.
