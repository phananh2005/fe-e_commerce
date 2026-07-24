---
version: V1_3_5
date: 2026-07-24
breaking_change: false
---

# V1_3_5: Thêm API lấy summary biến thể sản phẩm

## Mô tả thay đổi

Thêm API mới để lấy thông tin summary (sku, stock, price, avatar) của tất cả biến thể sản phẩm. API này hữu ích khi cần xem nhanh thông tin tồn kho mà không cần toàn bộ chi tiết.

## API thay đổi

### Endpoint mới

**GET** `/management/product/{productId}/variants/summary`

Lấy thông tin summary của tất cả biến thể sản phẩm (sku, stock, price, avatar image).

#### Request

- Path parameter: `productId` (Long, bắt buộc)

#### Response (200 OK)

```json
{
  "message": "Get product variants summary successfully",
  "result": {
    "productId": 1,
    "variants": [
      {
        "variantId": 101,
        "skuCode": "SKU-001",
        "stockQuantity": 50,
        "price": 299000,
        "avatarImageUrl": "https://res.cloudinary.com/..."
      },
      {
        "variantId": 102,
        "skuCode": "SKU-002",
        "stockQuantity": 30,
        "price": 349000,
        "avatarImageUrl": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

#### Error Response

- **404 Not Found**: Product không tồn tại
  ```json
  {
    "message": "Product not found",
    "error": "PRODUCT_NOT_FOUND",
    "statusCode": 404
  }
  ```

## Ảnh hưởng tới Frontend

### Các màn hình/module bị ảnh hưởng

- Quản lý tồn kho sản phẩm
- Dashboard xem nhanh stock của product
- Form cập nhật stock

### Hướng dẫn cập nhật Frontend

1. **Thêm gọi API mới**:
   - Endpoint: `GET /management/product/{productId}/variants/summary`
   - Dùng khi cần xem nhanh thông tin tồn kho các variant

2. **Cách sử dụng**:
   ```javascript
   // Gọi API lấy summary variants
   const response = await api.get(`/management/product/${productId}/variants/summary`);
   
   // Dữ liệu trả về
   const { productId, variants } = response.result;
   
   // Hiển thị thông tin
   variants.forEach(v => {
     console.log(`${v.skuCode}: ${v.stockQuantity} cái - ${v.price}đ`);
   })
   ```

3. **Tính năng mới**:
   - Lấy toàn bộ variants với stock info
   - Không bao gồm attributes, full images - chỉ avatar
   - Phù hợp cho dashboard và list view

4. **So sánh với endpoint hiện có**:
   - `GET /management/product/{productId}/variants`: Trả về full chi tiết (attributes, tất cả images, audit fields)
   - `GET /management/product/{productId}/variants/summary` (NEW): Chỉ trả về summary (sku, stock, price, avatar)

## Breaking Change

Không có. API mới không ảnh hưởng đến các API cũ.

## Ghi chú

- Field `avatarImageUrl` có thể là `null` nếu variant chưa có avatar image
- `price` là kiểu Double (có thể 2 chữ số thập phân)
- `stockQuantity` là kiểu Integer
- Endpoint quản lý, cần authentication với role MANAGEMENT
