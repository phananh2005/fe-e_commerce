# V1_1_4 - Thêm `cancellationReason` vào OrderDetailResponse

**Version**: V1_1_4  
**Ngày tạo**: 2026-07-21  
**Mục đích**: Cung cấp lý do hủy đơn hàng cho FE khi đơn hàng có status CANCELLED hoặc RETURNED

## API thay đổi

1. **Get Order Detail** - Lấy chi tiết đơn hàng
2. **Get Order Detail For Management** - Lấy chi tiết đơn hàng (quản trị)

## Chi tiết thay đổi

### Get Order Detail & Get Order Detail For Management
- **Endpoint**: 
  - `GET /orders/my-orders/{orderId}` (khách hàng xem đơn hàng của mình)
  - `GET /management/order/{orderId}` (quản trị viên xem đơn hàng)
- **Loại thay đổi**: Thêm field mới vào response
- **Trường được thêm**:
  - `cancellationReason` (string, nullable) - Lý do hủy đơn hàng

**Response cũ** (không có cancellationReason):
```json
{
  "orderId": 1,
  "userId": 123,
  "status": "CANCELLED",
  "totalPrice": 500000,
  "addressInfo": {
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "shippingAddress": "123 Đường ABC, TP.HCM"
  },
  "items": [...]
}
```

**Response mới** (có cancellationReason):
```json
{
  "orderId": 1,
  "userId": 123,
  "status": "CANCELLED",
  "totalPrice": 500000,
  "cancellationReason": "Khách hàng hủy đơn hàng",
  "addressInfo": {
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "shippingAddress": "123 Đường ABC, TP.HCM"
  },
  "items": [...]
}
```

## Logic xử lý cancellationReason

- **Nếu status = `CANCELLED` hoặc `RETURNED`**: `cancellationReason` chứa lý do hủy (string)
- **Nếu status = trạng thái khác** (PENDING, CONFIRMED, SHIPPED, DELIVERED): `cancellationReason` = `null`

## Chi tiết trường mới

| Field | Type | Nullable | Mô tả |
|-------|------|----------|-------|
| `cancellationReason` | String | Yes | Lý do hủy đơn hàng. Chỉ có giá trị khi status là CANCELLED hoặc RETURNED |

## Ví dụ Response đầy đủ

**Khi status = CANCELLED:**
```json
{
  "status": 200,
  "message": "Successfully retrieved order detail",
  "result": {
    "orderId": 1,
    "userId": 123,
    "createdAt": "2026-07-20T10:30:00",
    "modifiedAt": "2026-07-21T14:15:00",
    "createdBy": "system",
    "modifiedBy": "admin_user",
    "addressInfo": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0912345678",
      "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "isPaid": false,
    "paymentDate": null,
    "paymentMethod": "CASH",
    "shippingFee": 30000,
    "status": "CANCELLED",
    "totalPrice": 500000,
    "cancellationReason": "Khách hàng yêu cầu hủy - không còn nhu cầu",
    "items": [
      {
        "productId": 101,
        "productName": "Áo thun Nam",
        "skuCode": "SKU-001",
        "quantity": 2,
        "price": 200000,
        "variantImageUrl": "https://..."
      }
    ]
  }
}
```

**Khi status = DELIVERED (cancellationReason sẽ là null):**
```json
{
  "status": 200,
  "message": "Successfully retrieved order detail",
  "result": {
    "orderId": 2,
    "userId": 123,
    "createdAt": "2026-07-15T08:00:00",
    "modifiedAt": "2026-07-19T16:45:00",
    "createdBy": "system",
    "modifiedBy": "system",
    "addressInfo": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0912345678",
      "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "isPaid": true,
    "paymentDate": "2026-07-15T08:05:00",
    "paymentMethod": "VISA",
    "shippingFee": 30000,
    "status": "DELIVERED",
    "totalPrice": 500000,
    "cancellationReason": null,
    "items": [...]
  }
}
```

## Hướng dẫn FE cập nhật

### 1. Cập nhật type định nghĩa (TypeScript/JavaScript)

**Cũ** (không có cancellationReason):
```typescript
interface OrderDetail {
  orderId: number;
  userId: number;
  status: string;
  totalPrice: number;
  addressInfo: AddressInfo;
  items: Item[];
}
```

**Mới** (có cancellationReason):
```typescript
interface OrderDetail {
  orderId: number;
  userId: number;
  status: string;
  totalPrice: number;
  cancellationReason?: string | null;
  addressInfo: AddressInfo;
  items: Item[];
}
```

### 2. Cập nhật giao diện hiển thị lý do hủy

**React example:**
```jsx
function OrderDetailView({ order }) {
  return (
    <div className="order-detail">
      <h2>Chi tiết đơn hàng #{order.orderId}</h2>
      
      <div className="order-status">
        <p>Trạng thái: {order.status}</p>
        
        {/* Hiển thị lý do hủy nếu đơn hàng bị hủy */}
        {(order.status === 'CANCELLED' || order.status === 'RETURNED') && 
         order.cancellationReason && (
          <div className="cancellation-reason alert alert-warning">
            <strong>Lý do hủy:</strong> {order.cancellationReason}
          </div>
        )}
      </div>
      
      {/* Hiển thị các thông tin khác */}
      <div className="order-items">
        {order.items.map(item => (
          <OrderItem key={item.productId} item={item} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Cập nhật hàm fetch/API call

```typescript
async function fetchOrderDetail(orderId: number): Promise<OrderDetail> {
  const response = await fetch(`/orders/my-orders/${orderId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch order detail');
  }
  
  const data = await response.json();
  return data.result;
}

// Sử dụng
const order = await fetchOrderDetail(1);
console.log('Cancellation reason:', order.cancellationReason);
```

### 4. Thêm xử lý hiển thị lý do hủy trong bảng quản lý đơn hàng (nếu có)

```jsx
function OrderManagementTable({ orders }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Trạng thái</th>
          <th>Lý do hủy</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.orderId}>
            <td>{order.orderId}</td>
            <td>{order.status}</td>
            <td>
              {order.cancellationReason ? (
                <span title={order.cancellationReason}>
                  {order.cancellationReason.substring(0, 30)}...
                </span>
              ) : (
                <span className="text-muted">-</span>
              )}
            </td>
            <td>
              <button onClick={() => viewDetail(order.orderId)}>Xem</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 5. Thêm unit test (nếu có)

```typescript
describe('OrderDetail Component', () => {
  it('should display cancellation reason when status is CANCELLED', () => {
    const order = {
      orderId: 1,
      status: 'CANCELLED',
      cancellationReason: 'Khách hàng hủy',
      // ...
    };
    
    const { getByText } = render(<OrderDetailView order={order} />);
    expect(getByText(/Lý do hủy:/)).toBeInTheDocument();
    expect(getByText(/Khách hàng hủy/)).toBeInTheDocument();
  });

  it('should NOT display cancellation reason when status is DELIVERED', () => {
    const order = {
      orderId: 2,
      status: 'DELIVERED',
      cancellationReason: null,
      // ...
    };
    
    const { queryByText } = render(<OrderDetailView order={order} />);
    expect(queryByText(/Lý do hủy:/)).not.toBeInTheDocument();
  });
});
```

## Status

- **Breaking Change**: Không (field mới, nullable, optional)
- **Ảnh hưởng**:
  - Màn hình xem chi tiết đơn hàng khách hàng
  - Màn hình xem chi tiết đơn hàng quản trị viên
  - Bảng danh sách đơn hàng quản trị (nếu cần hiển thị lý do hủy)
  - Bất kỳ component nào render OrderDetailResponse
- **Độ ưu tiên**: Trung bình

## Ghi chú

- `cancellationReason` được set từ Order entity khi backend cập nhật trạng thái CANCELLED/RETURNED
- FE không cần phải gửi `cancellationReason` lên backend, chỉ nhận từ response
- Field này luôn có trong response, nhưng giá trị sẽ là `null` nếu status không phải CANCELLED hoặc RETURNED
- Nên thêm kiểm tra null/undefined khi render để tránh lỗi
- Có thể cache response OrderDetail để tránh gọi API nhiều lần nếu không cần cập nhật real-time
