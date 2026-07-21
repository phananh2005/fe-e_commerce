# V1.0.8 - Thêm xác thực ownership cho getOrderDetail

**Version**: V1.0.8  
**Date**: 2026-07-21  
**Status**: Active

## API thay đổi

| API | Method | Thay đổi |
|-----|--------|---------|
| `GET /orders/my-orders/{orderId}` | GET | Thêm xác thực: customer chỉ có thể xem đơn hàng của chính mình |

## Chi tiết thay đổi

### GET /orders/my-orders/{orderId}

**Hành vi mới:**

Khi customer gọi endpoint này, backend sẽ kiểm tra xem đơn hàng có thuộc về user hiện tại hay không:
- Nếu `orderId` thuộc về user hiện tại → trả về chi tiết đơn hàng (HTTP 200)
- Nếu `orderId` thuộc về user khác hoặc không tồn tại → trả về lỗi (HTTP 403 Forbidden)

**Response body** - Không thay đổi:

```json
{
  "result": {
    "id": 123,
    "orderCode": "ORD-20260721-001",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0987654321",
    "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "status": "PENDING",
    "paymentMethod": "COD",
    "isPaid": false,
    "totalPrice": 500000,
    "shippingFee": 0,
    "items": [
      {
        "variantId": 1,
        "productName": "Sản phẩm A",
        "price": 250000,
        "quantity": 2,
        "totalPrice": 500000
      }
    ],
    "createdAt": "2026-07-21T10:30:00"
  },
  "message": "Get order detail successfully"
}
```

**Error Response** - Khi user cố truy cập đơn hàng của người khác:

```json
{
  "code": 403,
  "message": "Forbidden"
}
```

## Hướng dẫn cập nhật Frontend

### 1. Thêm xử lý error 403 Forbidden

**Trước:**
```typescript
try {
  const response = await fetch(`/orders/my-orders/${orderId}`);
  const data = await response.json();
  return data.result;
} catch (error) {
  console.error('Error:', error);
}
```

**Sau:**
```typescript
try {
  const response = await fetch(`/orders/my-orders/${orderId}`);
  
  if (response.status === 403) {
    throw new Error('Bạn không có quyền xem đơn hàng này');
  }
  
  if (!response.ok) {
    throw new Error('Không thể lấy chi tiết đơn hàng');
  }
  
  const data = await response.json();
  return data.result;
} catch (error) {
  console.error('Error:', error);
  // Hiển thị thông báo lỗi cho user
}
```

### 2. Cập nhật xử lý trong component xem chi tiết đơn hàng

- Thêm xử lý lỗi 403: Hiển thị thông báo "Bạn không có quyền xem đơn hàng này"
- Người dùng sẽ bị chuyển hướng về danh sách đơn hàng (`/my-orders`) hoặc trang chủ
- Không hiển thị chi tiết đơn hàng nếu nhận được lỗi 403

### 3. Kiểm tra khi render chi tiết đơn hàng

- Chỉ hiển thị chi tiết đơn hàng khi request thành công (status 200)
- Hiển thị loading state khi đang fetch
- Hiển thị error state nếu có lỗi (bao gồm 403, 404, 500 v.v.)

## Breaking Change

**Có** - Nếu frontend cũ không xử lý error 403:
- Request sẽ bị reject với HTTP 403
- Nếu frontend cũ không có error handler, page sẽ crash hoặc hiển thị error generic
- User cũ cố gắng truy cập đơn hàng của người khác sẽ gặp lỗi (hành vi mong muốn)

## Ảnh hưởng

- Màn hình xem chi tiết đơn hàng: Thêm xử lý error 403 và chuyển hướng người dùng
- Bảo mật: Ngăn chặn customer xem đơn hàng của người khác
- UX: Hiển thị thông báo lỗi thân thiện khi user cố truy cập trái phép
