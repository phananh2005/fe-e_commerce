# V1.2.1 - Cập nhật Response Fields cho API Chi Tiết (Product, Order, User)

**Version:** V1.2.1  
**Ngày tạo:** 2026-07-23  
**Breaking Change:** Có

## Tóm tắt

Cập nhật response cho các API chi tiết của sản phẩm, đơn hàng, và người dùng. Thêm các field audit (`createdBy`, `createdAt`, `modifiedBy`, `modifiedAt`) và thông tin liên kết (danh mục, thương hiệu, người dùng). **Lưu ý quan trọng**: các trường `id` chỉ dùng cho backend operations (API calls), KHÔNG hiển thị lên giao diện Frontend.

## API thay đổi

### 1. `GET /management/product/{id}` - Chi tiết sản phẩm

#### Response cũ
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "avatarUrl": "https://example.com/image.jpg",
    "name": "Tên sản phẩm",
    "status": "ACTIVE",
    "modifiedAt": "2026-07-23T10:00:00"
  }
}
```

#### Response mới
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tên sản phẩm",
    "description": "Mô tả chi tiết sản phẩm",
    "avatarUrl": "https://example.com/image.jpg",
    "status": "ACTIVE",
    "categoryName": "Tên danh mục",
    "brandName": "Tên thương hiệu",
    "createdBy": "admin",
    "createdAt": "2026-07-20T08:00:00",
    "modifiedBy": "admin",
    "modifiedAt": "2026-07-23T10:00:00"
  }
}
```

#### Field mới/thay đổi:
- `description` (String, nullable): Mô tả chi tiết sản phẩm
- `categoryName` (String, nullable): Tên danh mục
- `brandName` (String, nullable): Tên thương hiệu
- `createdBy` (String, nullable): Người tạo sản phẩm
- `createdAt` (LocalDateTime, nullable): Thời gian tạo
- `modifiedBy` (String, nullable): Người sửa cuối

---

### 2. `GET /management/order/{orderUuid}` - Chi tiết đơn hàng

#### Response mới bổ sung
```json
{
  "code": 1000,
  "message": "Get order successfully",
  "result": {
    "id": 5,
    "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "orderCode": "ORD20260723001",
    "userUuid": "a47ac10b-58cc-4372-a567-0e02b2c3d479",
    "userName": "Nguyễn Văn A",
    "userEmail": "nguyenvanA@example.com",
    "status": "PENDING",
    "totalPrice": 500000,
    "createdBy": "system",
    "createdAt": "2026-07-23T08:00:00",
    "modifiedBy": "admin",
    "modifiedAt": "2026-07-23T10:00:00",
    "addressInfo": { ... },
    "orderItems": [ ... ]
  }
}
```

#### Field mới bổ sung:
- `userName` (String): Tên người dùng đặt hàng (lấy từ UserService)
- `userEmail` (String): Email người dùng (lấy từ UserService)
- `createdBy` (String, nullable): Ai tạo đơn hàng (thường là "system" nếu khách tạo, hoặc tên admin)
- `createdAt` (LocalDateTime, nullable): Thời gian tạo đơn hàng
- `modifiedBy` (String, nullable): Ai sửa cuối cùng
- `modifiedAt` (LocalDateTime, nullable): Thời gian sửa cuối

---

### 3. `GET /management/user/{userId}` - Chi tiết người dùng

#### Response mới bổ sung
```json
{
  "code": 1000,
  "message": "Get user successfully",
  "result": {
    "id": 3,
    "userUuid": "b47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn B",
    "phone": "0987654321",
    "avatar": "https://example.com/avatar.jpg",
    "status": "ACTIVE",
    "createdBy": "system",
    "createdAt": "2026-07-20T08:00:00",
    "modifiedBy": "admin",
    "modifiedAt": "2026-07-23T10:00:00"
  }
}
```

#### Field mới bổ sung:
- `createdBy` (String, nullable): Ai tạo tài khoản (thường "system" nếu tự đăng ký)
- `createdAt` (LocalDateTime, nullable): Thời gian tạo tài khoản
- `modifiedBy` (String, nullable): Ai sửa cuối cùng
- `modifiedAt` (LocalDateTime, nullable): Thời gian sửa cuối

---

## Breaking Changes

**Có** - Các response có thêm field mới, cần cập nhật interface.

## Hướng dẫn Frontend cập nhật

### 1. Quy tắc xử lý ID fields

**QUAN TRỌNG**: Các field `id` trong response chỉ dùng để:
- Gửi lên backend trong API calls (PUT, DELETE, etc.)
- Lưu vào state/cache để tracking
- **KHÔNG hiển thị lên UI giao diện**

Thay vào đó, sử dụng field UUID hoặc name để hiển thị cho người dùng.

**Ví dụ SAI** ❌:
```typescript
<span>ID sản phẩm: {product.id}</span>
<span>ID đơn hàng: {order.id}</span>
<span>ID người dùng: {user.id}</span>
```

**Ví dụ ĐÚNG** ✓:
```typescript
<span>Mã sản phẩm: {product.uuid}</span>
<span>Mã đơn hàng: {order.orderCode}</span>
<span>Tên người dùng: {order.userName}</span>
```

### 2. Cập nhật TypeScript Interfaces

#### Product Detail Response
```typescript
interface ProductDetailResponseForManagement {
  id: number; // Dùng cho backend calls, không hiển thị
  uuid: string; // Hiển thị cho user
  name: string;
  description: string | null;
  avatarUrl: string | null;
  status: string;
  categoryName: string | null;
  brandName: string | null;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
}
```

#### Order Detail Response
```typescript
interface OrderDetailResponseForManagement {
  id: number; // Dùng cho backend calls, không hiển thị
  orderUuid: string; // Hiển thị cho user
  orderCode: string; // Hiển thị cho user
  userUuid: string; // Dùng cho API calls
  userName: string; // Hiển thị cho user
  userEmail: string; // Hiển thị cho user
  status: string;
  totalPrice: number;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  addressInfo: AddressInfo;
  orderItems: OrderItem[];
}
```

#### User Detail Response
```typescript
interface UserDetailResponseForManagement {
  id: number; // Dùng cho backend calls, không hiển thị
  userUuid: string; // Dùng cho API calls
  email: string;
  fullName: string;
  phone: string;
  avatar: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
}
```

### 3. Cập nhật UI Components

#### Product Detail Component
```tsx
export function ProductDetailPage({ productId }: { productId: number }) {
  const [product, setProduct] = useState<ProductDetailResponseForManagement | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      // Sử dụng id để gọi API (backend operations)
      const response = await api.get<ApiResponse<ProductDetailResponseForManagement>>(
        `/management/product/${productId}`
      );
      setProduct(response.result);
    };
    fetchProduct();
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      {/* Hiển thị uuid, không hiển thị id */}
      <h2>{product.name}</h2>
      <p>UUID: {product.uuid}</p>
      <p>Mô tả: {product.description || 'Không có mô tả'}</p>
      <p>Danh mục: {product.categoryName || 'Chưa phân loại'}</p>
      <p>Thương hiệu: {product.brandName || 'Chưa có thương hiệu'}</p>
      <p>Người tạo: {product.createdBy || 'N/A'}</p>
      <p>Ngày tạo: {product.createdAt ? formatDate(product.createdAt) : 'N/A'}</p>
      <p>Người sửa: {product.modifiedBy || 'N/A'}</p>
      <p>Ngày sửa: {product.modifiedAt ? formatDate(product.modifiedAt) : 'N/A'}</p>
    </div>
  );
}
```

#### Order Detail Component
```tsx
export function OrderDetailPage({ orderUuid }: { orderUuid: string }) {
  const [order, setOrder] = useState<OrderDetailResponseForManagement | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      // Sử dụng orderUuid để gọi API
      const response = await api.get<ApiResponse<OrderDetailResponseForManagement>>(
        `/management/order/${orderUuid}`
      );
      setOrder(response.result);
    };
    fetchOrder();
  }, [orderUuid]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      {/* Hiển thị orderCode hoặc orderUuid, không hiển thị id */}
      <h2>Đơn hàng: {order.orderCode}</h2>
      <p>Mã UUID: {order.orderUuid}</p>
      <p>Khách hàng: {order.userName}</p>
      <p>Email: {order.userEmail}</p>
      <p>Trạng thái: {order.status}</p>
      <p>Tổng tiền: {formatPrice(order.totalPrice)}</p>
      <p>Người tạo: {order.createdBy || 'N/A'}</p>
      <p>Ngày tạo: {order.createdAt ? formatDate(order.createdAt) : 'N/A'}</p>
      {/* Hiển thị các items */}
      <OrderItems items={order.orderItems} />
    </div>
  );
}
```

#### User Detail Component
```tsx
export function UserDetailPage({ userId }: { userId: number }) {
  const [user, setUser] = useState<UserDetailResponseForManagement | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      // Sử dụng userId để gọi API
      const response = await api.get<ApiResponse<UserDetailResponseForManagement>>(
        `/management/user/${userId}`
      );
      setUser(response.result);
    };
    fetchUser();
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      {/* Hiển thị fullName, email, không hiển thị id */}
      <h2>{user.fullName}</h2>
      <p>Email: {user.email}</p>
      <p>Điện thoại: {user.phone}</p>
      <p>Trạng thái: {user.status}</p>
      {user.avatar && <img src={user.avatar} alt={user.fullName} />}
      <p>Người tạo: {user.createdBy || 'N/A'}</p>
      <p>Ngày tạo: {user.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
      <p>Người sửa: {user.modifiedBy || 'N/A'}</p>
      <p>Ngày sửa: {user.modifiedAt ? formatDate(user.modifiedAt) : 'N/A'}</p>
    </div>
  );
}
```

### 4. Quy tắc sử dụng ID trong API calls

```typescript
// ✓ ĐÚNG: Dùng id khi cần gửi lên backend
const updateProduct = async (productId: number, data: ProductUpdateRequest) => {
  await api.put(`/management/product/${productId}`, data);
};

const deleteOrder = async (orderId: number) => {
  await api.delete(`/management/order/${orderId}`);
};

// ✗ SAI: Hiển thị id cho user
<span>Mã sản phẩm: {product.id}</span> // Sai, dùng uuid
<span>Mã đơn hàng: {order.id}</span>   // Sai, dùng orderCode
```

### 5. Test cases cần kiểm tra

- [ ] API chi tiết sản phẩm trả về đầy đủ field mới
- [ ] API chi tiết đơn hàng trả về userName, userEmail
- [ ] API chi tiết người dùng trả về audit fields
- [ ] Field `id` không hiển thị lên UI (chỉ dùng trong state/cache)
- [ ] Field UUID/orderCode/name hiển thị thay vì ID
- [ ] Xử lý null cho các field audit khi là dữ liệu cũ
- [ ] Xử lý null cho categoryName, brandName khi không có liên kết
- [ ] Test format date/time cho createdAt, modifiedAt
- [ ] Test với dữ liệu từng phần missing

## Ảnh hưởng

### Màn hình bị ảnh hưởng:
- Trang chi tiết sản phẩm
- Trang chi tiết đơn hàng
- Trang chi tiết người dùng
- Modal/Dialog hiển thị thông tin chi tiết

### Module bị ảnh hưởng:
- Product management
- Order management
- User management

## Lưu ý quan trọng

1. **Không hiển thị ID lên giao diện**: Dùng UUID, orderCode, hoặc tên thay vì ID
2. **Field audit có thể null**: Với dữ liệu cũ, các field createdBy/createdAt/modifiedBy có thể chưa có
3. **Backend gọi service**: categoryName, brandName, userName được lấy từ service tương ứng
4. **Xử lý từng trường hợp null**: Chuẩn bị fallback text cho từng trường có thể null

## Checklist hoàn thành

- [ ] Cập nhật TypeScript interfaces
- [ ] Cập nhật tất cả API call types
- [ ] Cập nhật UI không hiển thị ID (chỉ dùng UUID/code/name)
- [ ] Thêm hiển thị audit fields nếu cần
- [ ] Thêm hiển thị categoryName, brandName, userName
- [ ] Test xử lý null cho tất cả field có thể nullable
- [ ] Format date/time cho createdAt, modifiedAt
- [ ] Test với sản phẩm/đơn hàng/người dùng không có dữ liệu liên kết
- [ ] Test với dữ liệu cũ (audit fields null)
