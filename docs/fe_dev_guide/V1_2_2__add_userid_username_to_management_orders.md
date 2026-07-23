# V1.2.2 - Thêm userId cho danh sách và username cho chi tiết đơn hàng quản trị

**Version:** V1.2.2  
**Ngày tạo:** 2026-07-23  
**Breaking Change:** Không

## Tóm tắt

Thêm field `userId` vào response `GET /management/order`; field `username` đã được thêm vào response `GET /management/order/{orderId}`.

## API thay đổi

### `GET /management/order` - Danh sách đơn hàng (Management)
### `GET /management/order/{orderId}` - Chi tiết đơn hàng (Management)

#### Response cũ
```json
{
  "code": 1000,
  "message": "Get orders successfully",
  "result": {
    "content": [
      {
        "orderId": 5,
        "userId": 3,
        "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "userUuid": "a47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "nguyen_van_a",
        "totalPrice": 500000,
        "status": "PENDING",
        "createdAt": "2026-07-23T08:00:00",
        "modifiedAt": "2026-07-23T10:00:00",
        "items": [...]
      }
    ]
  }
}
```

#### Response cũ
```json
{
  "code": 1000,
  "message": "Get order detail successfully",
  "result": {
    "orderId": 5,
    "userId": 3,
    "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "userUuid": "a47ac10b-58cc-4372-a567-0e02b2c3d479",
    "createdAt": "2026-07-23T08:00:00",
    "modifiedAt": "2026-07-23T10:00:00",
    "createdBy": "system",
    "modifiedBy": "admin",
    "addressInfo": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0912345678",
      "shippingAddress": "123 Đường ABC, TP HCM"
    },
    "isPaid": true,
    "paymentDate": "2026-07-23T08:05:00",
    "paymentMethod": "BANK_TRANSFER",
    "shippingFee": 30000,
    "status": "PENDING",
    "totalPrice": 500000,
    "cancellationReason": null,
    "items": [...]
  }
}
```

#### Response mới
```json
{
  "code": 1000,
  "message": "Get orders successfully",
  "result": {
    "content": [
      {
        "orderId": 5,
        "userId": 3,
        "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "userUuid": "a47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "nguyen_van_a",
        "totalPrice": 500000,
        "status": "PENDING",
        "createdAt": "2026-07-23T08:00:00",
        "modifiedAt": "2026-07-23T10:00:00",
        "items": [...]
      }
    ]
  }
}
```

#### Response mới
```json
{
  "code": 1000,
  "message": "Get order detail successfully",
  "result":       {
        "orderId": 5,
        "userId": 3,
        "orderUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "userUuid": "a47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "nguyen_van_a",
    "createdAt": "2026-07-23T08:00:00",
    "modifiedAt": "2026-07-23T10:00:00",
    "createdBy": "system",
    "modifiedBy": "admin",
    "addressInfo": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0912345678",
      "shippingAddress": "123 Đường ABC, TP HCM"
    },
    "isPaid": true,
    "paymentDate": "2026-07-23T08:05:00",
    "paymentMethod": "BANK_TRANSFER",
    "shippingFee": 30000,
    "status": "PENDING",
    "totalPrice": 500000,
    "cancellationReason": null,
    "items": [...]
  }
}
```

#### Field mới bổ sung:
- `userId` (number, nullable): ID nội bộ của người dùng đặt hàng, dùng cho các API backend cần ID.
- `username` (String, nullable): Tên đăng nhập của người dùng đặt hàng. Có thể null nếu đơn hàng không liên kết với user nào.

## Breaking Changes

**Không** - Thêm field mới, không ảnh hưởng đến các field cũ.

## Hướng dẫn Frontend cập nhật

### 1. Cập nhật TypeScript Interface

```typescript
interface ManagementOrderResponse {
  orderId: number;
  userId: number | null;
  orderUuid: string;
  userUuid: string | null;
  username: string | null;
  totalPrice: number;
  status: string;
  createdAt: string | null;
  modifiedAt: string | null;
  items: OrderItem[];
}

interface OrderDetailResponseForManagement {
  orderId: number;
  userId: number | null;
  orderUuid: string;
  userUuid: string | null;
  username: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  addressInfo: AddressInfo;
  isPaid: boolean;
  paymentDate: string | null;
  paymentMethod: string;
  shippingFee: number;
  status: string;
  totalPrice: number;
  cancellationReason: string | null;
  items: OrderItem[];
}
```

### 2. Cập nhật UI Component

```tsx
export function OrderDetailPage({ orderId }: { orderId: number }) {
  const [order, setOrder] = useState<OrderDetailResponseForManagement | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const response = await api.get<ApiResponse<OrderDetailResponseForManagement>>(
        `/management/order/${orderId}`
      );
      setOrder(response.result);
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h2>Đơn hàng: {order.orderUuid}</h2>
      
      {/* Thêm hiển thị username */}
      <div className="customer-info">
        <p>Khách hàng: {order.username || 'N/A'}</p>
        <p>Địa chỉ giao hàng: {order.addressInfo.shippingAddress}</p>
        <p>Số điện thoại: {order.addressInfo.phoneNumber}</p>
      </div>

      <p>Trạng thái: {order.status}</p>
      <p>Tổng tiền: {formatPrice(order.totalPrice)}</p>
      <p>Ngày tạo: {order.createdAt ? formatDate(order.createdAt) : 'N/A'}</p>
      
      {/* Hiển thị các items */}
      <OrderItems items={order.items} />
    </div>
  );
}
```

### 3. Xử lý null cho username

```typescript
// Nếu username null, có thể dùng fullName từ addressInfo làm fallback
const displayName = order.username || order.addressInfo.fullName || 'Khách hàng ẩn danh';

<p>Khách hàng: {displayName}</p>
```

### 4. Test cases cần kiểm tra

- [ ] API danh sách đơn hàng trả về field `userId`
- [ ] API danh sách đơn hàng trả về field `username`
- [ ] API chi tiết đơn hàng trả về field `username`
- [ ] Hiển thị đúng username cho đơn hàng có user
- [ ] Dùng `userId` cho API backend cần ID, không hiển thị trực tiếp trên UI
- [ ] Xử lý null khi userId, userUuid hoặc username không có
- [ ] Dùng fullName từ addressInfo làm fallback khi username null
- [ ] Kiểm tra với các user khác nhau

## Ảnh hưởng

### Màn hình bị ảnh hưởng:
- Trang danh sách đơn hàng (Management)
- Trang chi tiết đơn hàng (Management)
- Modal/Dialog hiển thị thông tin chi tiết đơn hàng

### Module bị ảnh hưởng:
- Order management

## Lưu ý quan trọng

1. **userId và username có thể null**: Nếu đơn hàng không liên kết với user (hoặc user bị xóa), các field này có thể null
2. **Fallback để hiển thị**: Dùng fullName từ addressInfo làm fallback nếu username null
3. **Không hiển thị ID**: `userId` chỉ dùng cho API backend cần ID, không hiển thị trực tiếp trên UI

## Checklist hoàn thành

- [ ] Cập nhật TypeScript interface management order list thêm field `userId`
- [ ] Cập nhật TypeScript interface order detail thêm field `username`
- [ ] Cập nhật UI hiển thị username
- [ ] Thêm fallback để xử lý null userId, userUuid, username
- [ ] Test với đơn hàng có user
- [ ] Test với đơn hàng không có user
- [ ] Kiểm tra layout không bị phá vỡ khi username dài
