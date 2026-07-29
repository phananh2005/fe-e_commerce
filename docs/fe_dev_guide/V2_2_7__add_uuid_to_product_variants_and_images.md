---
version: V2.2.7
date: 2026-07-29
summary: Add variantUuid and imageUuid to product response DTOs
breaking_change: false
---

# V2.2.7: Thêm UUID vào Product Variant và Variant Image

## Danh sách API thay đổi
- `GET /product/{id}` (Customer)
- `GET /management/product/{id}` (Management)
- `GET /management/product/{id}/variants-summary` (Management)

## Chi tiết thay đổi

Các đối tượng trả về liên quan đến Product Variant và Variant Image đã được bổ sung thêm trường UUID:

1. **Customer Product Detail (`ProductDetailResponse.ProductVariantDetail`)**:
   - Thêm `variantUuid` (kiểu String)
   - Thêm `imageUuid` (kiểu String) trong mảng `variantImageUrl`

2. **Management Product Variant (`ProductVariantResponseForManagement`)**:
   - Thêm `uuid` (kiểu String)
   - Thêm `uuid` (kiểu String) trong mảng `variantImageUrl`

3. **Management Product Variants Summary (`ProductVariantsSummaryResponseForManagement.Variant`)**:
   - Thêm `variantUuid` (kiểu String)

### Response mẫu (Customer Product Detail):

```json
{
  "productId": 1,
  // ...
  "variants": [
    {
      "variantId": 10,
      "variantUuid": "550e8400-e29b-41d4-a716-446655440000",
      "variantSkuCode": "SKU-A",
      // ...
      "variantImageUrl": [
        {
          "imageId": 100,
          "imageUuid": "770e8400-e29b-41d4-a716-446655440001",
          "imageUrl": "http...",
          "isAvatar": true
        }
      ]
    }
  ]
}
```

## Hướng dẫn FE cập nhật
- Frontend có thể sử dụng `variantUuid` và `imageUuid` để định danh biến thể/hình ảnh nếu cần.
- Hiện tại không có breaking change. Các trường ID cũ như `variantId` và `imageId` vẫn tồn tại và hoạt động bình thường.
