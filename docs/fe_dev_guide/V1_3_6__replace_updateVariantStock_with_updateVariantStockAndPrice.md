---
version: V1_3_6
date: 2026-07-24
breaking_change: true
---

# V1_3_6: Thay thế API cập nhật stock biến thể bằng API cập nhật stock và price

## Mô tả thay đổi

Xóa API cũ `updateVariantStock` chỉ cập nhật stock, thay thế bằng API mới cho phép cập nhật đồng thời cả stock và price của biến thể sản phẩm.

## API thay đổi

### API bị xóa

**PATCH** `/management/product/variant/{variantId}/{stockQuantity}` ❌ **ĐÃ XÓA**

API này không còn tồn tại, không thể sử dụng nữa.

### API mới

**PATCH** `/management/product/variant/{variantId}` ✅ **MỚI**

Cập nhật số lượng tồn kho và/hoặc giá của một biến thể sản phẩm.

#### Request

- Path parameter: `variantId` (Long, bắt buộc)
- Request body:
  ```json
  {
    "stockQuantity": 100,
    "price": 299000
  }
  ```

**Lưu ý**: Cả 2 field đều optional, có thể gửi:
- Chỉ `stockQuantity`: chỉ cập nhật stock
- Chỉ `price`: chỉ cập nhật giá
- Cả hai: cập nhật cả stock và giá

#### Response (204 No Content)

Không có response body khi thành công.

#### Error Response

- **404 Not Found**: Variant không tồn tại
  ```json
  {
    "message": "Product variant not found",
    "error": "PRODUCT_VARIANT_NOT_FOUND",
    "statusCode": 404
  }
  ```

- **400 Bad Request**: Số lượng âm
  ```json
  {
    "message": "Invalid quantity",
    "error": "INVALID_QUANTITY",
    "statusCode": 400
  }
  ```

- **409 Conflict**: Concurrent update error
  ```json
  {
    "message": "Concurrent update error",
    "error": "CONCURRENT_UPDATE_ERROR",
    "statusCode": 409
  }
  ```

## Ảnh hưởng tới Frontend

### Các màn hình/module bị ảnh hưởng

- Quản lý tồn kho sản phẩm
- Form cập nhật stock của variant
- Form cập nhật giá của variant
- Dashboard quản lý sản phẩm

### Hướng dẫn cập nhật Frontend

#### 1. **Thay thế API cũ**

**Trước đây** (API cũ - không còn hoạt động):
```javascript
// ❌ API này đã bị xóa
await api.patch(`/management/product/variant/${variantId}/${stockQuantity}`);
```

**Bây giờ** (API mới):
```javascript
// ✅ Chỉ cập nhật stock
await api.patch(`/management/product/variant/${variantId}`, {
  stockQuantity: 100
});

// ✅ Chỉ cập nhật price
await api.patch(`/management/product/variant/${variantId}`, {
  price: 299000
});

// ✅ Cập nhật cả stock và price
await api.patch(`/management/product/variant/${variantId}`, {
  stockQuantity: 100,
  price: 299000
});
```

#### 2. **Validation phía Frontend**

```javascript
// Kiểm tra stockQuantity nếu có
if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
  throw new Error('Số lượng không được âm');
}

// Kiểm tra price nếu có
if (data.price !== undefined && data.price <= 0) {
  throw new Error('Giá phải lớn hơn 0');
}
```

#### 3. **Xử lý form**

```javascript
const handleUpdateVariant = async (variantId, formData) => {
  const requestBody = {};
  
  // Chỉ gửi field nào có thay đổi
  if (formData.stockQuantity !== undefined) {
    requestBody.stockQuantity = formData.stockQuantity;
  }
  
  if (formData.price !== undefined) {
    requestBody.price = formData.price;
  }
  
  await api.patch(`/management/product/variant/${variantId}`, requestBody);
};
```

#### 4. **Retry logic cho concurrent update**

```javascript
const updateVariantWithRetry = async (variantId, data, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await api.patch(`/management/product/variant/${variantId}`, data);
      return; // Success
    } catch (error) {
      if (error.error === 'CONCURRENT_UPDATE_ERROR' && i < maxRetries - 1) {
        // Retry sau 500ms
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      throw error; // Throw nếu không phải concurrent error hoặc hết retry
    }
  }
};
```

## Breaking Change

**CÓ - Đây là breaking change**

API cũ **PATCH** `/management/product/variant/{variantId}/{stockQuantity}` đã bị xóa hoàn toàn.

**Frontend BẮT BUỘC phải cập nhật** nếu đang sử dụng API cũ, nếu không sẽ nhận lỗi 404 Not Found.

## Migration Checklist cho Frontend

- [ ] Tìm tất cả nơi gọi API cũ `/management/product/variant/{variantId}/{stockQuantity}`
- [ ] Thay thế bằng API mới với request body
- [ ] Cập nhật validation form (nếu có)
- [ ] Test trường hợp chỉ update stock
- [ ] Test trường hợp chỉ update price
- [ ] Test trường hợp update cả hai
- [ ] Test xử lý error 404, 400, 409
- [ ] Deploy và verify trên production

## Ghi chú

- Field `stockQuantity` và `price` đều optional trong request body
- Nếu không gửi field nào, giá trị cũ sẽ được giữ nguyên
- `stockQuantity` không được âm
- `price` kiểu BigDecimal (có thể có 2 chữ số thập phân)
- API có optimistic locking, có thể gặp `CONCURRENT_UPDATE_ERROR` khi nhiều request đồng thời
- Response 204 No Content khi thành công, không có response body
