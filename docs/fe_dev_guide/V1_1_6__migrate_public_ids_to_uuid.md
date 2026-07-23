# V1.1.6: Migrate Public IDs to UUID

**Ngày tạo:** 2026-07-22

**Phạm vi:** API responses cho User, Product, Order

**Loại thay đổi:** Breaking Change (đổi structure response)

## Tóm tắt thay đổi

Các entities chính (User, Product, Order) đã có trường `uuid` (UUID string) làm public identifier trong API responses:
- User: expose `uuid`
- Product: expose `productUuid`
- Order: expose `orderUuid` và `userUuid`

**Lưu ý quan trọng:**
- ProductVariant **không** có UUID, vẫn dùng `variantId` (Long)
- OrderItem **không** có UUID riêng, chỉ chứa `productUuid`
- Trường `id` (Long) internal không được expose trong API response

## Chi tiết API thay đổi

### 1. User API Responses

**Trước (V0):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

**Sau (V1.1.6):**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

**Thay đổi:**
- Xóa field `id`
- Thêm field `uuid` (String format)

### 2. Product API Responses

#### 2a. ProductSummaryResponse (List/Search)
**Sau (V1.1.6):**
```json
{
  "productUuid": "660e8400-e29b-41d4-a716-446655440001",
  "productName": "Product Name",
  "minPrice": 100.00,
  "avatarUrl": "http://..."
}
```

#### 2b. ProductDetailResponse (Detail page)
**Trước (V0):**
```json
{
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
- Field `productUuid` đã được expose (không thay đổi)
- `variantId` vẫn là Long (không chuyển sang UUID)
- Các field khác giữ nguyên

### 3. Order API Responses

#### 3a. OrderSummaryResponse (Order History List)
**Sau (V1.1.6):**
```json
{
  "orderUuid": "880e8400-e29b-41d4-a716-446655440003",
  "totalPrice": 500.00,
  "status": "PENDING",
  "items": [
    {
      "productName": "Product Name",
      "skuCode": "SKU123",
      "quantity": 2,
      "price": 250.00,
      "variantImageUrl": "http://..."
    }
  ]
}
```

#### 3b. OrderDetailResponse (Order Detail Page)
**Trước (V0):**
```json
{
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
- Field `orderUuid` đã được expose (không thay đổi)
- Field `userUuid` đã được expose (không thay đổi)
- Items không chứa `variantId` hoặc `variantUuid`
- Không có trường `uuid` cho OrderItem

## Hướng dẫn cập nhật Frontend

### 1. Cập nhật Data Models/Types

```typescript
interface User {
  uuid: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  roles: string[];
  isEnabled: boolean;
}

interface ProductSummary {
  productUuid: string;
  productName: string;
  minPrice: number;
  avatarUrl: string;
}

interface ProductDetail {
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

interface OrderSummary {
  orderUuid: string;
  totalPrice: number;
  status: string;
  items: OrderItem[];
}

interface OrderDetail {
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
  productUuid: string;
  productName: string;
  skuCode: string;
  quantity: number;
  price: number;
  variantImageUrl: string;
}

interface AddressInfo {
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
}
```

### 2. Cập nhật API Service/Client

```javascript
// User API - sử dụng UUID
const user = await getUser('550e8400-e29b-41d4-a716-446655440000');
axios.get(`/api/users/${userUuid}`)

// Product API - ProductUuid đã được expose
const productDetail = await getProductDetail('660e8400-e29b-41d4-a716-446655440001');
axios.get(`/api/products/${productUuid}`)

// Order API - OrderUuid và UserUuid được expose
const order = await getOrderDetail('880e8400-e29b-41d4-a716-446655440003');
axios.get(`/api/orders/${orderUuid}`)
```

### 3. Cập nhật component/page state

- Tất cả reference đến User ID phải chuyển sang UUID
- ProductUuid đã được expose từ BE, cập nhật components dùng Product
- OrderUuid và UserUuid đã được expose, cập nhật Order-related components
- Nếu lưu trữ user/order UUID trong localStorage, Redux, Context - cần update
- Nếu dùng UUID để routing, cần update URL params
- VariantId vẫn là Long, giữ nguyên cách xử lý

### 4. Cập nhật UI display

- Xóa hoặc che dấu UUID nếu hiển thị. UUID không thân thiện với user
- Nếu hiển thị Product/Order ID, thay bằng UUID tương ứng

## Ảnh hưởng tới các màn hình/flow

- **User Profile:** Tất cả reference đến user ID → userUuid
- **Product Catalog:** ProductUuid đã được expose từ BE
- **Product Details:** ProductUuid được dùng, variantId vẫn là Long
- **Shopping Cart:** Sử dụng productUuid
- **Order History:** OrderUuid đã được expose, userUuid được expose
- **Order Detail:** OrderUuid, UserUuid được expose, items chứa productUuid
- **Checkout:** Sử dụng productUuid từ response
- **Admin Dashboard:** Tất cả dùng productUuid, orderUuid, userUuid

## Breaking Change

⚠️ **Có breaking changes:**
- User API: ID (Long) được thay bằng UUID (String)
- Order API: ID (Long) được thay bằng UUID (String), userUuid được expose
- Product API: ProductUuid được expose, nhưng variantId vẫn là Long (không thay đổi)

Nếu FE không cập nhật cách lưu trữ và truyền UUIDs, sẽ gặp lỗi khi gọi API User và Order.

## Phiên bản Backend

Backend version: >= 1.1.6 (với UUID support cho User, Product, Order)

## Danh sách API endpoints thay đổi

| Endpoint | Thay đổi | Ghi chú |
|----------|---------|--------|
| GET /api/users/{uuid} | UserInfoResponse.uuid | Response trả UUID |
| GET /api/products | ProductSummaryResponse | productUuid được expose |
| GET /api/products/{productUuid} | ProductDetailResponse | productUuid được expose, variantId vẫn Long |
| GET /api/orders | OrderSummaryResponse | orderUuid được expose |
| GET /api/orders/{orderUuid} | OrderDetailResponse | orderUuid, userUuid được expose |

## Kiểm tra

Sau khi cập nhật, test các flow sau:

- [ ] User login/profile page hiển thị đúng UUID
- [ ] Product list page hoạt động với productUuid
- [ ] Product detail page hoạt động, variant vẫn dùng variantId
- [ ] Add product to cart (dùng productUuid)
- [ ] Checkout và tạo order (dùng productUuid)
- [ ] View order history (dùng orderUuid)
- [ ] View order detail (dùng orderUuid, userUuid)
- [ ] Admin view products/orders/users (dùng UUIDs tương ứng)
