# V1.1.0 - Refactor OrderDetailResponse: tách AddressInfo inner class

**Version**: V1.1.0  
**Date**: 2026-07-21  
**Status**: Active

## API thay đổi

| API | Method | Thay đổi |
|-----|--------|---------|
| `GET /orders/my-orders/{orderId}` | GET | Response structure refactor: `fullName`, `phoneNumber`, `shippingAddress` → `addressInfo` object |
| `GET /management/order/{orderId}` | GET | Response structure refactor: `fullName`, `phoneNumber`, `shippingAddress` → `addressInfo` object |

## Chi tiết thay đổi

### OrderDetailResponse - Refactor Response Structure

**Trước (flat structure):**
```json
{
  "result": {
    "orderId": 123,
    "userId": 5,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0987654321",
    "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "status": "PENDING",
    "paymentMethod": "COD",
    "isPaid": false,
    "totalPrice": 500000,
    "shippingFee": 0,
    "items": [...]
  }
}
```

**Sau (grouped AddressInfo):**
```json
{
  "result": {
    "orderId": 123,
    "userId": 5,
    "addressInfo": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0987654321",
      "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "status": "PENDING",
    "paymentMethod": "COD",
    "isPaid": false,
    "totalPrice": 500000,
    "shippingFee": 0,
    "items": [...]
  }
}
```

## Hướng dẫn cập nhật Frontend

### 1. Cập nhật type/interface

**Trước:**
```typescript
interface OrderDetailResponse {
  orderId: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
  // ...
}
```

**Sau:**
```typescript
interface OrderDetailResponse {
  orderId: number;
  userId: number;
  addressInfo: {
    fullName: string;
    phoneNumber: string;
    shippingAddress: string;
  };
  status: string;
  totalPrice: number;
  items: OrderItem[];
  // ...
}
```

### 2. Cập nhật component xem chi tiết đơn hàng

**Trước:**
```typescript
const { fullName, phoneNumber, shippingAddress } = orderDetail;
```

**Sau:**
```typescript
const { addressInfo } = orderDetail;
const { fullName, phoneNumber, shippingAddress } = addressInfo;

// hoặc trực tiếp
const fullName = orderDetail.addressInfo.fullName;
const phoneNumber = orderDetail.addressInfo.phoneNumber;
const shippingAddress = orderDetail.addressInfo.shippingAddress;
```

### 3. Cập nhật form hiển thị thông tin nhận hàng

**Trước:**
```typescript
<div>
  <p>{orderDetail.fullName}</p>
  <p>{orderDetail.phoneNumber}</p>
  <p>{orderDetail.shippingAddress}</p>
</div>
```

**Sau:**
```typescript
<div>
  <p>{orderDetail.addressInfo.fullName}</p>
  <p>{orderDetail.addressInfo.phoneNumber}</p>
  <p>{orderDetail.addressInfo.shippingAddress}</p>
</div>
```

### 4. Cập nhật mapping data từ form checkout

Nếu frontend có form nhập thông tin nhận hàng, cập nhật cách lưu/gửi:

**Trước:**
```typescript
const orderData = {
  fullName: form.fullName,
  phoneNumber: form.phoneNumber,
  shippingAddress: form.shippingAddress,
  items: [...]
};
```

**Sau (cũng không thay đổi vì đây là request, không phải response):**
```typescript
const orderData = {
  fullName: form.fullName,
  phoneNumber: form.phoneNumber,
  shippingAddress: form.shippingAddress,
  items: [...]
};
```

### 5. Cập nhật test cases

Nếu có unit test hoặc e2e test:
- Mock data response phải sử dụng `addressInfo` object
- Update assertions để kiểm tra `response.addressInfo.fullName` thay vì `response.fullName`

## Breaking Change

**Có** - Response structure thay đổi:
- Frontend cũ sẽ không tìm thấy `fullName`, `phoneNumber`, `shippingAddress` ở level root
- Sẽ gặp lỗi: `Cannot read property 'fullName' of undefined` nếu code cố truy cập `orderDetail.fullName`
- **Yêu cầu:** Update tất cả code xử lý response này

## Ảnh hưởng

- **Clarity:** Rõ ràng phân biệt thông tin nhận hàng (addressInfo) vs thông tin order khác
- **Maintainability:** Dễ mở rộng thêm field vào addressInfo sau này
- **Type safety:** Giúp IDE autocomplete tốt hơn khi truy cập `addressInfo`
- **Codebase:** Backend refactor, frontend phải cập nhật tất cả nơi sử dụng OrderDetailResponse
