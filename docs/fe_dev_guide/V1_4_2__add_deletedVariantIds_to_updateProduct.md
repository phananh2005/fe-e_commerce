# Version 1.4.2 - Add deletedVariantIds to Update Product API

**Ngày tạo**: 2026-07-25  
**API thay đổi**: `updateProduct` (Management Product Controller)  
**Loại thay đổi**: Cập nhật Request  
**Breaking change**: Không

---

## Chi tiết thay đổi

### Endpoint
```
PUT /management/product/update
```

### Request Changes

**Thư mục**: `docs/fe_dev_guide/`  
**File migration**: `V1_4_2__add_deletedVariantIds_to_updateProduct.md`

---

## Thêm field mới vào ProductUpdateRequest

### Modified: `ProductUpdateRequest`

**Vị trí**: `src/main/java/com/phananh/e_commerce/product/presentation/dto/request/management/ProductUpdateRequest.java`

### Thay đổi:

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `deletedVariantIds` | `List<Long>` | Tùy chọn | Danh sách ID các variant bị xóa |

### Ví dụ Request:

```json
{
  "productId": 123,
  "name": "Updated Product Name",
  "description": "Updated description",
  "categoryId": 5,
  "brandId": 10,
  "productAvatarUrl": "https://cloudinary.com/...",
  "variants": [
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
      "variantImageIdsToDelete": [789],
      "variantImagesUrlsToAdd": ["https://cloudinary.com/new-image.jpg"]
    }
  ],
  "newVariants": [
    {
      "skuCode": "SKU-NEW",
      "price": 149000,
      "stockQuantity": 20,
      "variantAvatarUrl": "https://cloudinary.com/new-variant.jpg",
      "variantImageUrls": ["https://cloudinary.com/variant1.jpg"],
      "attributes": {
        "color": "blue",
        "size": "L"
      }
    }
  ],
  "deletedVariantIds": [789, 999]
}
```

---

## Hướng dẫn cập nhật Frontend

### Khi người dùng xóa variant trong UI:

1. Khi user click nút "Xóa" trên một variant:
   - Xóa variant khỏi UI list
   - Lưu ID của variant đã xóa vào một array tạm (ví dụ: `deletedVariantIds`)

2. Khi user submit form update product:
   - Gửi `deletedVariantIds` cùng với request update product
   - Backend sẽ xóa các variant có ID trong danh sách này khỏi database

### Code example (React/TypeScript):

```typescript
interface ProductUpdateRequest {
  productId: number;
  name?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  productAvatarUrl?: string;
  variants?: VariantUpdateRequest[];
  newVariants?: VariantCreateRequest[];
  deletedVariantIds?: number[];
}

const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);

const handleDeleteVariant = (variantId: number) => {
  setDeletedVariantIds(prev => [...prev, variantId]);
};

const handleSubmit = async () => {
  const requestBody: ProductUpdateRequest = {
    productId: product.id,
    name: form.name,
    variants: form.variants,
    newVariants: form.newVariants,
    deletedVariantIds: deletedVariantIds
  };
  
  await api.updateProduct(requestBody);
};
```

---

## Breaking change: Không

Field `deletedVariantIds` là tùy chọn (optional). Nếu không gửi field này lên, backend sẽ xử lý như trước (không xóa variant nào).

---

## Ảnh hưởng tới màn hình/module FE:

- **Management Product Detail screen**: Cần lưu track các variant bị xóa bởi user
- **Product Form component**: Cần gửi `deletedVariantIds` khi user submit form
- **Variant list component**: Khi xóa variant, cần lưu ID vào `deletedVariantIds`

---

## Version history:

- **Previous version**: `V1_4_1__remove_sku_code_unique_constraint.md`
- **Next version**: (chưa có)
