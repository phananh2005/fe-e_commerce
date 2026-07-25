# Version 1.4.3 - Rename Product Update Request Fields

**Ngày tạo**: 2026-07-25  
**API thay đổi**: `updateProduct` (Management Product Controller)  
**Loại thay đổi**: Cập nhật Request  
**Breaking change**: Có

---

## Chi tiết thay đổi

### Endpoint
```
PUT /management/product/update
```

### Request Changes

**Thư mục**: `docs/fe_dev_guide/`  
**File migration**: `V1_4_3__rename_product_update_request_fields.md`

---

## Renamed Fields

### Modified: `ProductUpdateRequest`

**Vị trí**: `src/main/java/com/phananh/e_commerce/product/presentation/dto/request/management/ProductUpdateRequest.java`

### Thay đổi tên field:

| Field cũ | Field mới | Type | Required | Mô tả |
|-----------|-----------|------|----------|-------|
| `variants` | `existVariants` | `List<VariantUpdateRequest>` | Tùy chọn | Danh sách variant đang tồn tại cần cập nhật |
| `variantImagesUrlsToAdd` | `variantDetailImageUrlsToAdd` | `List<String>` | Tùy chọn | URLs ảnh chi tiết mới chưa có trong DB |
| `variantImageIdsToDelete` | `variantDetailImageIdsToDelete` | `List<Long>` | Tùy chọn | ID ảnh chi tiết cần xóa khỏi DB |
| `variantImageUrls` | `variantDetailImageUrls` | `List<String>` | Tùy chọn | URLs ảnh chi tiết cho variant mới (không bao gồm avatar) |

---

## Ví dụ Request:

### Before (V1.4.2):
```json
{
  "productId": 123,
  "name": "Updated Product Name",
  "variants": [
    {
      "variantId": 456,
      "variantImagesUrlsToAdd": ["https://cloudinary.com/new-image.jpg"]
    }
  ],
  "newVariants": [
    {
      "skuCode": "SKU-NEW",
      "variantImageUrls": ["https://cloudinary.com/variant1.jpg"]
    }
  ]
}
```

### After (V1.4.3):
```json
{
  "productId": 123,
  "name": "Updated Product Name",
  "existVariants": [
    {
      "variantId": 456,
      "skuCode": "SKU-001",
      "price": 99000,
      "stockQuantity": 10,
      "variantAvatarUrl": "https://cloudinary.com/...",
      "attributes": {
        "color": "red",
        "size": "M"
      },
      "variantDetailImageIdsToDelete": [789],
      "variantDetailImageUrlsToAdd": ["https://cloudinary.com/new-image.jpg"]
    }
  ],
  "newVariants": [
    {
      "skuCode": "SKU-NEW",
      "variantDetailImageUrls": ["https://cloudinary.com/variant1.jpg"]
    }
  ]
}
```

---

## Hướng dẫn cập nhật Frontend

### 1. Cập nhật request object:

```typescript
interface ProductUpdateRequest {
  productId: number;
  name?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  productAvatarUrl?: string;
  existVariants?: VariantUpdateRequest[];
  newVariants?: VariantCreateRequest[];
  deletedVariantIds?: number[];
}

interface VariantUpdateRequest {
  variantId: number;
  skuCode: string;
  price: number;
  stockQuantity: number;
  variantAvatarUrl?: string;
  variantDetailImageUrlsToAdd?: string[];
  variantDetailImageIdsToDelete?: number[];
  attributes?: Record<string, string>;
}

interface VariantCreateRequest {
  skuCode: string;
  price: number;
  stockQuantity: number;
  variantAvatarUrl?: string;
  variantDetailImageUrls?: string[];
  attributes?: Record<string, string>;
}
```

### 2. Code example (React/TypeScript):

```typescript
const handleSubmit = async () => {
  const requestBody: ProductUpdateRequest = {
    productId: product.id,
    name: form.name,
    existVariants: form.existVariants?.map(v => ({
      variantId: v.variantId,
      skuCode: v.skuCode,
      price: v.price,
      stockQuantity: v.stockQuantity,
      variantAvatarUrl: v.variantAvatarUrl,
      variantDetailImageUrlsToAdd: v.variantDetailImageUrlsToAdd,
      variantDetailImageIdsToDelete: v.variantDetailImageIdsToDelete,
      attributes: v.attributes
    })),
    newVariants: form.newVariants?.map(v => ({
      skuCode: v.skuCode,
      price: v.price,
      stockQuantity: v.stockQuantity,
      variantAvatarUrl: v.variantAvatarUrl,
      variantDetailImageUrls: v.variantDetailImageUrls,
      attributes: v.attributes
    })),
    deletedVariantIds: deletedVariantIds
  };
  
  await api.updateProduct(requestBody);
};
```

---

## Breaking change: Có

Tất cả field names đã thay đổi. Frontend BẮT BUỘC phải cập nhật các tên field sau:

1. `variants` → `existVariants`
2. `variantImagesUrlsToAdd` → `variantDetailImageUrlsToAdd`
3. `variantImageIdsToDelete` → `variantDetailImageIdsToDelete`
4. `variantImageUrls` → `variantDetailImageUrls`

Lưu ý: 
- `variantDetailImageUrlsToAdd` dùng cho `VariantUpdateRequest` - ảnh chi tiết mới chưa có trong DB
- `variantDetailImageIdsToDelete` dùng cho `VariantUpdateRequest` - ID ảnh chi tiết cần xóa khỏi DB
- `variantDetailImageUrls` dùng cho `VariantCreateRequest` - ảnh chi tiết cho variant mới

---

## Ảnh hưởng tới màn hình/module FE:

- **Management Product Detail screen**: Cập nhật request object khi update product
- **Product Form component**: Đổi tên field từ `variants` → `existVariants`, từ `variantImagesUrlsToAdd`/`variantImageUrls` → `variantDetailImageUrls`
- **API service layer**: Cập nhật interface request/response type definitions

---

## Version history:

- **Previous version**: `V1_4_2__add_deletedVariantIds_to_updateProduct.md`
- **Next version**: (chưa có)
