# V1_4_5: Thêm status (ACTIVE/INACTIVE) cho product variant

**Phiên bản**: V1_4_5  
**Ngày tạo**: 2026-07-25  
**Loại thay đổi**: Thêm field mới vào API (không breaking)  
**Breaking change**: Không

## Mô tả thay đổi

Backend thêm field `status` (ENUM: ACTIVE, INACTIVE) cho mỗi product variant. Cho phép quản lý từng variant riêng biệt (ví dụ: variant size M có thể bị inactive).

## API bị ảnh hưởng

### 1. PUT /management/product/{productId}

**Request**: Thêm field `status` (optional) vào `existVariants`

```json
{
  "existVariants": [
    {
      "variantId": 100,
      "skuCode": "SKU001",
      "price": 100.00,
      "stockQuantity": 50,
      "status": "ACTIVE"
    }
  ]
}
```

**Response**: Thêm `status` vào variant objects trong response

### 2. PATCH /management/product/variant/{variantId}

**Request**: Thêm field `status` (optional)

```json
{
  "stockQuantity": 50,
  "price": 100.00,
  "status": "INACTIVE"
}
```

**Response**: Trả về variant updated với `status`

### 3. GET /management/product/{id}

**Response**: Thêm `status` vào mỗi variant

```json
{
  "variants": [
    {
      "id": 100,
      "skuCode": "SKU001",
      "price": 100.00,
      "stockQuantity": 50,
      "status": "ACTIVE",
      "createdAt": "2026-07-25T09:00:00",
      ...
    }
  ]
}
```

### 4. GET /management/product/search

**Response**: Thêm `status` vào mỗi variant summary

### 5. GET /management/product/{productId}/variants/summary

**Response**: Thêm `status` vào mỗi variant

```json
{
  "variants": [
    {
      "variantId": 100,
      "skuCode": "SKU001",
      "stockQuantity": 50,
      "price": 100.00,
      "status": "ACTIVE",
      "avatarImageUrl": "..."
    }
  ]
}
```

### 6. GET /product/{id} (Customer)

**Response**: Chỉ trả về variant có `status: ACTIVE`. Variant inactive được filter ra.

```json
{
  "variants": [
    {
      "variantId": 100,
      "variantSkuCode": "SKU001",
      "variantPrice": 100.00,
      "stockQuantity": 50,
      "status": "ACTIVE",
      "variantImageUrl": [...]
    }
  ]
}
```

**Lưu ý**: Nếu tất cả variant của sản phẩm đều inactive, variants array sẽ rỗng.

## Hướng dẫn Frontend

### 1. Thêm field status vào variant objects

Khi cập nhật product, thêm `status` vào form:

```typescript
interface VariantUpdate {
  variantId: number;
  skuCode: string;
  price: number;
  stockQuantity: number;
  status?: "ACTIVE" | "INACTIVE";
}

interface UpdateVariantRequest {
  stockQuantity: number;
  price: number;
  status?: "ACTIVE" | "INACTIVE";
}
```

### 2. Cập nhật request khi update product

```typescript
await updateProduct(productId, {
  existVariants: [
    {
      variantId: 100,
      skuCode: "SKU001",
      price: 100.00,
      stockQuantity: 50,
      status: "ACTIVE"
    }
  ]
});
```

### 3. Cập nhật request khi update stock/price

```typescript
await updateVariantStockAndPrice(variantId, {
  stockQuantity: 50,
  price: 100.00,
  status: "INACTIVE"  // optional
});
```

### 4. Xử lý UI

- **Admin/Management**: Hiển thị status của mỗi variant, cho phép toggle ACTIVE/INACTIVE
- **Customer**: Không cần xử lý đặc biệt, backend filter inactive variants

### 5. Mô tả trạng thái

- **ACTIVE**: Variant hiển thị cho customer, có thể mua
- **INACTIVE**: Variant ẩn khỏi danh sách customer, nhưng vẫn có thể được sử dụng trong order cũ

## Ảnh hưởng tới màn hình/flow

### Màn hình quản trị sản phẩm - Edit Product

- Thêm field status cho mỗi variant (dropdown: ACTIVE/INACTIVE)
- Cho phép người dùng toggle status khi edit

### Màn hình danh sách sản phẩm khách hàng

- Variant inactive sẽ không hiển thị tự động (backend filter)
- Không cần xử lý thêm trên FE

### Màn hình chi tiết sản phẩm khách hàng

- Chỉ hiển thị variant active
- Nếu tất cả variant inactive → hiển thị "Hết hàng" hoặc tương tự

## Default values

- Variant mới tạo: `status = "ACTIVE"` (mặc định)
- Khi update product mà không gửi status → giữ nguyên status cũ
- Khi update stock/price mà không gửi status → giữ nguyên status cũ

## Lưu ý kỹ thuật

- Status là ENUM, chỉ nhận giá trị: `"ACTIVE"` hoặc `"INACTIVE"`
- Nếu gửi giá trị khác → API trả về 400 Bad Request
- Field status là optional trong request (nếu không gửi, giữ nguyên)
- Field status luôn có trong response

## Status

✅ Đã triển khai backend  
⏳ Chờ frontend cập nhật
