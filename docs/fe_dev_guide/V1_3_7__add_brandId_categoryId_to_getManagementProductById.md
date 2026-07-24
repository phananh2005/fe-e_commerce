---
version: V1_3_7
date: 2026-07-24
breaking_change: false
---

# V1_3_7: Thêm brandId và categoryId vào response getManagementProductById

## Mô tả thay đổi

Cập nhật API lấy chi tiết sản phẩm quản trị để trả về `brandId` và `categoryId` nhằm hỗ trợ frontend cập nhật thông tin brand và category mà không cần gọi API riêng.

## API thay đổi

### GET `/management/product/{id}`

Lấy chi tiết sản phẩm theo ID (API hiện tại được cập nhật).

#### Response

Response body đã được cập nhật, thêm 2 field mới:

```json
{
  "result": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Product Name",
    "description": "Product description",
    "avatarUrl": "https://example.com/avatar.jpg",
    "status": "ENABLED",
    "brandId": 5,
    "categoryId": 10,
    "createdBy": "admin",
    "createdAt": "2026-07-24T10:00:00Z",
    "modifiedBy": "admin",
    "modifiedAt": "2026-07-24T15:30:00Z"
  },
  "message": "Get product successfully"
}
```

#### Field mới

| Field | Type | Mô tả |
|-------|------|-------|
| `brandId` | Long | ID của brand sản phẩm |
| `categoryId` | Long | ID của category sản phẩm |

## Ảnh hưởng tới Frontend

### Các màn hình/module bị ảnh hưởng

- Form cập nhật sản phẩm (product edit form)
- Chi tiết sản phẩm quản trị (product detail view)
- Dashboard quản lý sản phẩm

### Hướng dẫn cập nhật Frontend

#### 1. **Cập nhật giao diện**

Frontend có thể lấy `brandId` và `categoryId` từ response mà không cần gọi API riêng:

**Trước đây** (cách cũ):
```javascript
// Cần gọi 2 API riêng để lấy tên brand/category
const product = await api.get(`/management/product/${id}`);
const brand = await api.get(`/management/brand/${product.result.brandId}`);
const category = await api.get(`/management/category/${product.result.categoryId}`);
```

**Bây giờ** (cách mới):
```javascript
// Chỉ cần 1 API call, có sẵn brandId và categoryId
const response = await api.get(`/management/product/${id}`);
const product = response.result;
const { brandId, categoryId } = product;
```

#### 2. **Cập nhật form cập nhật sản phẩm**

```javascript
const ProductEditForm = ({ productId }) => {
  const [product, setProduct] = React.useState(null);

  React.useEffect(() => {
    const fetchProduct = async () => {
      const response = await api.get(`/management/product/${productId}`);
      setProduct(response.result);
    };
    fetchProduct();
  }, [productId]);

  const handleSubmit = async (formData) => {
    // Có thể sử dụng brandId và categoryId trực tiếp
    await api.put(`/management/product/update`, {
      ...formData,
      brandId: product.brandId,
      categoryId: product.categoryId
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {product && (
        <>
          <input defaultValue={product.name} name="name" />
          <input defaultValue={product.brandId} name="brandId" />
          <input defaultValue={product.categoryId} name="categoryId" />
        </>
      )}
    </form>
  );
};
```

#### 3. **Cập nhật chi tiết sản phẩm**

```javascript
const ProductDetailView = ({ productId }) => {
  const [product, setProduct] = React.useState(null);

  React.useEffect(() => {
    const fetchProduct = async () => {
      const response = await api.get(`/management/product/${productId}`);
      setProduct(response.result);
    };
    fetchProduct();
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Brand ID: {product.brandId}</p>
      <p>Category ID: {product.categoryId}</p>
      <p>{product.description}</p>
      <img src={product.avatarUrl} alt={product.name} />
    </div>
  );
};
```

#### 4. **Lưu ý với TypeScript**

Nếu sử dụng TypeScript, cần cập nhật type definition:

```typescript
interface ProductDetailResponseForManagement {
  id: number;
  uuid: string;
  name: string;
  description: string;
  avatarUrl: string;
  status: string;
  brandId: number;  // ✅ Thêm field này
  categoryId: number;  // ✅ Thêm field này
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
}
```

## Breaking Change

**KHÔNG - Đây không phải breaking change**

- API endpoint không thay đổi
- Method HTTP vẫn là GET
- Field cũ không bị xóa
- Chỉ thêm 2 field mới vào response
- Frontend cũ vẫn hoạt động bình thường, chỉ không sử dụng 2 field mới

## Migration Checklist cho Frontend

- [ ] Cập nhật type definition nếu sử dụng TypeScript
- [ ] Thêm xử lý `brandId` và `categoryId` trong form cập nhật sản phẩm
- [ ] Cập nhật chi tiết sản phẩm view để hiển thị brandId/categoryId (nếu cần)
- [ ] Loại bỏ các API call riêng để lấy brand/category info (nếu đang làm)
- [ ] Test form cập nhật sản phẩm
- [ ] Test chi tiết sản phẩm
- [ ] Deploy và verify trên production

## Ghi chú

- `brandId` là Long, chỉ là ID của brand, không phải thông tin brand đầy đủ
- `categoryId` là Long, chỉ là ID của category, không phải thông tin category đầy đủ
- Nếu cần thông tin chi tiết brand/category (name, icon, ...), vẫn cần gọi API brand/category riêng
- Field này giúp frontend giảm số lần gọi API khi cập nhật sản phẩm
- Giá trị luôn tồn tại và không null vì sản phẩm bắt buộc phải có brand và category

