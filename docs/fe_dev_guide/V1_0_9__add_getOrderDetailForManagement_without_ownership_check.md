# V1.0.9 - Thêm API getOrderDetailForManagement cho quản trị viên

**Version**: V1.0.9  
**Date**: 2026-07-21  
**Status**: Active

## API thay đổi

| API | Method | Thay đổi |
|-----|--------|---------|
| `GET /management/order/{orderId}` | GET | Dùng hàm mới `getOrderDetailForManagement` không kiểm tra ownership |
| `GET /orders/my-orders/{orderId}` | GET | Giữ xác thực ownership cho customer |

## Chi tiết thay đổi

### Tách biệt 2 API getOrderDetail

**1. API Customer (giữ nguyên xác thực ownership):**
- **Endpoint:** `GET /orders/my-orders/{orderId}`
- **Service:** `OrderService.getOrderDetail(Long orderId)`
- **Xác thực:** Customer chỉ xem đơn hàng của chính mình, nếu không → 403 Forbidden
- **Mục đích:** Customer xem chi tiết đơn hàng của riêng mình

**2. API Management (mới không kiểm tra ownership):**
- **Endpoint:** `GET /management/order/{orderId}`
- **Service:** `OrderService.getOrderDetailForManagement(Long orderId)`
- **Xác thực:** Chỉ kiểm tra order tồn tại (không kiểm tra userId)
- **Mục đích:** Quản trị viên/staff xem chi tiết mọi đơn hàng

### Response body - Không thay đổi

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

## Hướng dẫn cập nhật Frontend

### 1. Phân biệt 2 loại API

**Customer API (từ app user):**
```typescript
// Customer xem đơn hàng của mình
const response = await fetch(`/orders/my-orders/${orderId}`);
```

**Management API (từ admin panel):**
```typescript
// Quản trị viên xem đơn hàng của bất kỳ user nào
const response = await fetch(`/management/order/${orderId}`);
```

### 2. Cập nhật type/interface (nếu cần)

Nếu đang dùng interface chung cho OrderDetailResponse, không cần thay đổi vì response body giống nhau.

### 3. Kiểm tra permission cho admin panel

- Quản trị viên/staff cần có quyền truy cập admin panel
- API endpoint `/management/*` cần authentication với role thích hợp
- Frontend admin panel nên ẩn/lock các action không có permission

### 4. Error handling

**Customer API:**
- 200: Thành công
- 403: Không có quyền (đơn hàng thuộc user khác)
- 404: Order không tồn tại

**Management API:**
- 200: Thành công
- 404: Order không tồn tại

## Breaking Change

**Không có** - API Management behavior không thay đổi đối với frontend:
- Quản trị viên vẫn xem được mọi đơn hàng như trước
- Response body không thay đổi
- Chỉ backend tách service method để xử lý logic riêng

## Ảnh hưởng

- **Customer side:** Không thay đổi, vẫn xác thực ownership chặt chẽ
- **Admin side:** Không thay đổi về behavior
- **Codebase:** Phân tách rõ ràng 2 use case:
  - Customer: ownership validation + security
  - Management: full access + không cần check ownership
