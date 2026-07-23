# V1.1.7: Add Back `id` Fields for API Calls

**Ngày tạo:** 2026-07-22

**Phạm vi:** API responses cho Product, Order, OrderItem

**Loại thay đổi:** Non-breaking change (thêm field mới, giữ field uuid)

## Tóm tắt thay đổi

Một số response DTO cần thêm lại field `id` (Long) để gửi tới các API khác, mặc dù đã có field `uuid`:

- Product: thêm `productId`
- Order: thêm `orderId` và `userId`
- OrderItem: thêm `productId` trong Item

## Chi tiết API thay đổi

### 1. Product API Responses

#### 1a. ProductSummaryResponse

**Sau (V1.1.7):**
```json
{
  "productId": 1,
  "productUuid": "660e8400-e29b-41d4-a716-446655440001",
  "productName": "Product Name",
  "minPrice": 100.00,
  "avatarUrl": "http://..."
}
```

**Thay đổi:**
- Thêm field `productId` (Long)

#### 1b. ProductDetailResponse

**Sau (V1.1.7):**
```json
{
  "productId": 1,
  "productUuid": "660e8400-e29b-41d4-a716-446655440001",
  "productName": "Product Name",
  "productDescription": "Description",
  "status": "ACTIVE",
  "avatarUrl": "http://...",
  "brandId": 1,
  "brandName": "Brand Name",
  "categoryId": 5,
  "categoryName": "Category Name",
  "minPrice": 100.00,
  "maxPrice": 150.00,
  "variants": [
    {
      "variantId": 10,
      "variantSkuCode": "SKU123",
      "variantPrice": 100.00,
      "stockQuantity": 50,
      "variantImageUrl": ["http://..."],
      "attributes": [
        {
          "attributeId": 1,
          "attributeName": "Color",
          "attributeValue": "Red"
        }
      ]
    }
  ]
}
```

**Thay đổi:**
- Thêm field `productId` (Long)
- Variants không có thay đổi, vẫn dùng `variantId`

### 2. Order API Responses

#### 2a. OrderDetailResponse

**Sau (V1.1.7):**
```json
{
  "orderId": 3,
  "userId": 1,
  "orderUuid": "880e8400-e29b-41d4-a716-446655440003",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "totalPrice": 500.00,
  "status": "PENDING",
  "addressInfo": {
    "fullName": "John Doe",
    "phoneNumber": "0123456789",
    "shippingAddress": "123 Main St"
  },
  "isPaid": false,
  "paymentMethod": "COD",
  "shippingFee": 50.00,
  "items": [
    {
      "productId": 1,
      "productUuid": "660e8400-e29b-41d4-a716-446655440001",
      "productName": "Product Name",
      "skuCode": "SKU123",
      "quantity": 2,
      "price": 250.00,
      "variantImageUrl": "http://..."
    }
  ]
}
```

**Thay đổi:**
- Thêm field `orderId` (Long)
- Thêm field `userId` (Long)
- Thêm field `productId` (Long) trong Item

#### 2b. ManagementOrderResponse

**Sau (V1.1.7):**
```json
{
  "orderId": 3,
  "orderUuid": "880e8400-e29b-41d4-a716-446655440003",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "totalPrice": 500.00,
  "status": "PENDING",
  "createdAt": "2026-07-22T10:00:00",
  "modifiedAt": "2026-07-22T10:00:00",
  "items": [
    {
      "productId": 1,
      "productUuid": "660e8400-e29b-41d4-a716-446655440001",
      "productName": "Product Name",
      "skuCode": "SKU123",
      "quantity": 2,
      "price": 250.00,
      "variantImageUrl": "http://..."
    }
  ]
}
```

**Thay đổi:**
- Thêm field `orderId` (Long)
- Thêm field `productId` (Long) trong Item

## Hướng dẫn cập nhật Frontend

### 1. Cập nhật Data Models/Types

```typescript
interface ProductSummary {
  productId: number;
  productUuid: string;
  productName: string;
  minPrice: number;
  avatarUrl: string;
}

interface ProductDetail {
  productId: number;
  productUuid: string;
  productName: string;
  productDescription: string;
  status: string;
  avatarUrl: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  minPrice: number;
  maxPrice: number;
  variants: ProductVariantDetail[];
}

interface ProductVariantDetail {
  variantId: number;
  variantSkuCode: string;
  variantPrice: number;
  stockQuantity: number;
  variantImageUrl: string[];
  attributes: Attribute[];
}

interface OrderDetail {
  orderId: number;
  userId: number;
  orderUuid: string;
  userUuid: string;
  totalPrice: number;
  status: string;
  addressInfo: AddressInfo;
  isPaid: boolean;
  paymentMethod: string;
  shippingFee: number;
  items: OrderItem[];
}

interface OrderItem {
  productId: number;
  productUuid: string;
  productName: string;
  skuCode: string;
  quantity: number;
  price: number;
  variantImageUrl: string;
}

interface ManagementOrder {
  orderId: number;
  orderUuid: string;
  userUuid: string;
  username: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  modifiedAt: string;
  items: OrderItem[];
}
```

### 2. Khi nào dùng `id` vs `uuid`

| Entity | Dùng `id` | Dùng `uuid` |
|--------|----------|-------------|
| Product | Gửi API update/delete | Display, GET APIs |
| Order | Internal operations | Display, GET APIs |
| User | Internal operations | Display, GET APIs |

### 3. Cập nhật API calls

```javascript
// Product - dùng productId cho API operations
axios.post(`/api/admin/products/${productId}/update`, data)
axios.delete(`/api/admin/products/${productId}`)

// Product - dùng productUuid cho display/GET
axios.get(`/api/products/${productUuid}`)

// Order - dùng orderId cho internal operations
axios.post(`/api/admin/orders/${orderId}/update-status`, data)

// Order - dùng orderUuid cho display/GET
axios.get(`/api/orders/${orderUuid}`)
```

## Ảnh hưởng tới các màn hình/flow

- **Product List:** Hiển thị `productUuid`, dùng `productId` cho admin actions
- **Product Detail:** Hiển thị `productUuid`, dùng `productId` cho admin update/delete
- **Order History:** Hiển thị `orderUuid`, dùng `orderId` cho admin operations
- **Order Detail:** Hiển thị `orderUuid`, dùng `orderId` và `productId` cho admin operations

## Breaking Change

❌ **Không phải breaking change.** Các field mới được thêm vào response, không ảnh hưởng đến existing code.

## Danh sách API endpoints thay đổi

| Endpoint | Thay đổi | Ghi chú |
|----------|---------|--------|
| GET /api/products | ProductSummaryResponse | Thêm `productId` |
| GET /api/products/{productUuid} | ProductDetailResponse | Thêm `productId` |
| GET /api/orders/{orderUuid} | OrderDetailResponse | Thêm `orderId`, `userId`, `productId` trong items |
| Management Order APIs | ManagementOrderResponse | Thêm `orderId`, `productId` trong items |

## Kiểm tra

Sau khi cập nhật, verify:

- [ ] Product list hiển thị đúng với productId
- [ ] Product detail hiển thị đúng với productId
- [ ] Order detail hiển thị đúng với orderId, userId, productId
- [ ] Admin operations dùng đúng id fields để call API