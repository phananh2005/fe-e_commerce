# V1_4_0 - Thêm productStatus vào API tạo sản phẩm

**Ngày:** 2026-07-25  
**Breaking Change:** Không

## Tóm tắt

API `POST /management/product/create` hiện tại đã hỗ trợ field `productStatus` (optional). FE có thể gửi `productStatus` khi tạo product để chọn trạng thái ban đầu (ACTIVE, DRAFT, hoặc INACTIVE).

## API thay đổi

### POST /management/product/create

**Request thay đổi:**

Thêm field `productStatus` (optional, mặc định DRAFT):

```json
{
  "name": "Tên sản phẩm",
  "description": "Mô tả sản phẩm",
  "categoryId": 1,
  "brandId": 1,
  "productAvatarUrl": "https://...",
  "productStatus": "ACTIVE",
  "variants": [
    {
      "skuCode": "SKU001",
      "price": 100000,
      "stockQuantity": 50,
      "attributes": {},
      "variantAvatarUrl": "https://...",
      "variantImageUrls": []
    }
  ]
}
```

**Response:** 204 No Content (không thay đổi)

## Chi tiết thay đổi

| Thành phần | Thay đổi | Ghi chú |
|-----------|---------|--------|
| Request body | Thêm field `productStatus` | Optional, giá trị: ACTIVE, DRAFT, INACTIVE |
| Response | Không thay đổi | Vẫn 204 No Content |
| Error handling | Thêm error code 400 | Invalid productStatus → INVALID_PRODUCT_STATUS |

## Hướng dẫn FE cập nhật

### 1. Cập nhật form tạo sản phẩm

Thêm dropdown/select field cho `productStatus`:

```typescript
interface ProductCreateForm {
  name: string;
  description: string;
  categoryId: number;
  brandId: number;
  productAvatarUrl: string;
  productStatus?: "ACTIVE" | "DRAFT" | "INACTIVE";  // Thêm field này
  variants: VariantCreateRequest[];
}
```

### 2. Gửi request

```typescript
const createProductRequest = {
  name: form.name,
  description: form.description,
  categoryId: form.categoryId,
  brandId: form.brandId,
  productAvatarUrl: form.productAvatarUrl,
  productStatus: form.productStatus || "DRAFT",  // Optional, mặc định DRAFT
  variants: form.variants
};

await axios.post('/management/product/create', createProductRequest);
```

### 3. Xử lý error

Nếu backend trả về 400 với error code `INVALID_PRODUCT_STATUS`:

```typescript
if (error.response?.data?.result?.code === ErrorCode.INVALID_PRODUCT_STATUS) {
  // Hiển thị thông báo: "Trạng thái sản phẩm không hợp lệ"
}
```

## Giá trị cho phép

| Giá trị | Mô tả |
|--------|------|
| ACTIVE | Sản phẩm hoạt động, hiển thị trên storefront |
| DRAFT | Sản phẩm nháp, chưa sẵn sàng, không hiển thị trên storefront |
| INACTIVE | Sản phẩm tạm thời ẩn, không hiển thị trên storefront |

## Backward Compatibility

✅ Không breaking change:
- FE cũ không gửi `productStatus` → backend mặc định DRAFT (như cũ)
- FE mới có thể gửi `productStatus` → backend dùng giá trị được chọn

## Lưu ý

- Field `productStatus` là optional, không bắt buộc
- Nếu không gửi hoặc gửi null → mặc định DRAFT
- Giá trị phải chính xác (ACTIVE, DRAFT, INACTIVE), không phân biệt chữ hoa/thường ở backend
- Sau khi tạo product, FE có thể dùng API `PATCH /management/product/{productId}/{status}` để cập nhật status sau này
