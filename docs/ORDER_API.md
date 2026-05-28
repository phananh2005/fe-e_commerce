# Order API

Module quản lý **Giỏ hàng (Cart)** và **Đơn hàng (Order)**.

---

## Wrapper Response chung

```json
{
  "code": 1000,
  "message": "...",
  "result": { ... }
}
```

---

## Enum: OrderStatus

```
PENDING    – Chờ xác nhận (khách vừa đặt)
CONFIRMED  – Đã xác nhận (shop chấp nhận)
SHIPPING   – Đang giao hàng
DELIVERED  – Đã giao thành công
CANCELLED  – Đã hủy
RETURNED   – Trả hàng / hoàn tiền
```

## Enum: PaymentMethod

```
COD            – Thanh toán khi nhận hàng
VNPAY          – Cổng VNPay
MOMO           – Ví MoMo
BANK_TRANSFER  – Chuyển khoản ngân hàng
PAYPAL         – Thanh toán quốc tế
```

---

# 1. Giỏ hàng (Cart)

> Yêu cầu: đã đăng nhập (Bearer token)  
> Base path: `/cart-item`

### 1.1 Lấy giỏ hàng của tôi

```
GET /cart-item/my-cart
```

**Response 200 – có sản phẩm:**
```json
{
  "code": 1000,
  "message": "Get cart successfully",
  "result": [
    {
      "cartItemId": 1,
      "productId": 10,
      "productName": "Giày Nike Air Max",
      "productStatus": "ACTIVE",
      "currentVariantId": "25",
      "variantSkuCode": "NIKE-AIR-RED-42",
      "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg",
      "variantPrice": 1200000.00,
      "stockQuantity": 50,
      "cartItemQuantity": 2
    }
  ]
}
```

**Response 200 – giỏ trống:**
```json
{
  "code": 1000,
  "message": "Cart is empty"
}
```

> `result` sẽ là `null` khi giỏ trống.

---

### 1.2 Thêm sản phẩm vào giỏ hàng

```
POST /cart-item/add
Content-Type: application/json
```

**Request Body:**
```json
{
  "variantId": 25,
  "quantity": 2
}
```

| Field       | Type       | Bắt buộc | Ghi chú                                              |
|-------------|------------|----------|------------------------------------------------------|
| `variantId` | Long       | ✅        |                                                      |
| `quantity`  | int (≥ 1)  | ✅        | Nếu variant đã có trong giỏ, số lượng sẽ được cộng thêm |

**Response 204:** No Content

---

### 1.3 Cập nhật sản phẩm trong giỏ hàng

```
PATCH /cart-item/update
Content-Type: application/json
```

**Request Body:**
```json
{
  "cartItemId": 1,
  "variantId": 25,
  "quantity": 3
}
```

| Field        | Type      | Bắt buộc | Ghi chú                        |
|--------------|-----------|----------|--------------------------------|
| `cartItemId` | Long      | ✅        | ID của cart item cần cập nhật  |
| `variantId`  | Long      | ✅        |                                |
| `quantity`   | int (≥ 1) | ✅        |                                |

**Response 200:** Trả về message string (không bọc ApiResponse)
```
"Cart item updated successfully"
```

---

### 1.4 Xóa sản phẩm khỏi giỏ hàng

```
DELETE /cart-item/remove/{ids}
```

| Param | Type    | Mô tả                                                        |
|-------|---------|--------------------------------------------------------------|
| `ids` | Long[]  | Danh sách `cartItemId` cần xóa, phân cách bằng dấu phẩy     |

**Ví dụ:** `DELETE /cart-item/remove/1,2,3`

**Response 204:** No Content

---

# 2. Đơn hàng – Customer

> Yêu cầu: đã đăng nhập (Bearer token)  
> Base path: `/orders`

### 2.1 Xem trước đơn hàng (Preview)

```
GET /orders/preview
Content-Type: application/json
```

**Request Body:** _(danh sách các item muốn xem trước)_
```json
[
  { "variantId": 25, "quantity": 2 },
  { "variantId": 30, "quantity": 1 }
]
```

| Field       | Type      | Bắt buộc |
|-------------|-----------|----------|
| `variantId` | Long      | ✅        |
| `quantity`  | int (≥ 1) | ✅        |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Preview order successfully",
  "result": {
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "shippingAddress": "456 Đường XYZ, Hà Nội",
    "shippingFee": 30000.00,
    "totalPrice": 2430000.00,
    "paymentMethods": ["COD", "VNPAY", "MOMO", "BANK_TRANSFER", "PAYPAL"],
    "items": [
      {
        "productId": 10,
        "productName": "Giày Nike Air Max",
        "skuCode": "NIKE-AIR-RED-42",
        "quantity": 2,
        "price": 1200000.00,
        "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg"
      }
    ]
  }
}
```

> `fullName`, `phoneNumber`, `shippingAddress` được lấy tự động từ thông tin tài khoản hiện tại.  
> `totalPrice` = tổng tiền hàng + `shippingFee`.

---

### 2.2 Đặt hàng (Checkout)

```
POST /orders/checkout
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0912345678",
  "paymentMethod": "COD",
  "shippingAddress": "456 Đường XYZ, Hà Nội",
  "items": [
    { "variantId": 25, "quantity": 2 },
    { "variantId": 30, "quantity": 1 }
  ]
}
```

| Field             | Type      | Bắt buộc | Ghi chú                                      |
|-------------------|-----------|----------|----------------------------------------------|
| `fullName`        | string    | ✅        | Tên người nhận                               |
| `phoneNumber`     | string    | ✅        |                                              |
| `paymentMethod`   | string    | ✅        | Một trong các giá trị `PaymentMethod`        |
| `shippingAddress` | string    | ✅        |                                              |
| `items`           | array     | ✅        | Không được rỗng                              |
| `items[].variantId` | Long    | ✅        |                                              |
| `items[].quantity`  | int (≥ 1)| ✅        |                                              |

**Response 204:** No Content

---

### 2.3 Lấy danh sách đơn hàng của tôi

```
GET /orders/my-orders
```

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get my orders successfully",
  "result": [
    {
      "orderId": 100,
      "totalPrice": 2430000.00,
      "status": "PENDING",
      "items": [
        {
          "productName": "Giày Nike Air Max",
          "skuCode": "NIKE-AIR-RED-42",
          "quantity": 2,
          "price": 1200000.00,
          "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg"
        }
      ]
    }
  ]
}
```

---

### 2.4 Lấy chi tiết đơn hàng

```
GET /orders/my-orders/{orderId}
```

| Param     | Type | Mô tả      |
|-----------|------|------------|
| `orderId` | Long | ID đơn hàng |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get order detail successfully",
  "result": {
    "orderId": 100,
    "userId": 5,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "shippingAddress": "456 Đường XYZ, Hà Nội",
    "shippingFee": 30000.00,
    "totalPrice": 2430000.00,
    "status": "PENDING",
    "isPaid": false,
    "paymentMethod": "COD",
    "paymentDate": null,
    "createdAt": "2024-06-01T10:00:00",
    "modifiedAt": "2024-06-01T10:00:00",
    "createdBy": "customer01",
    "modifiedBy": "customer01",
    "items": [
      {
        "productId": 10,
        "productName": "Giày Nike Air Max",
        "skuCode": "NIKE-AIR-RED-42",
        "quantity": 2,
        "price": 1200000.00,
        "variantImageUrl": "https://res.cloudinary.com/.../nike-red-42.jpg"
      }
    ]
  }
}
```

---

# 3. Đơn hàng – Staff / Admin

> Yêu cầu: role `ROLE_STAFF` hoặc `ROLE_ADMIN`  
> Base path: `/management`

### 3.1 Tìm kiếm & phân trang đơn hàng

```
GET /management/search
```

**Query Parameters:**

| Param      | Type   | Bắt buộc | Mặc định    | Ghi chú                        |
|------------|--------|----------|-------------|--------------------------------|
| `page`     | int    | ❌        | `1`         | Bắt đầu từ 1                   |
| `size`     | int    | ❌        | `10`        |                                |
| `sortBy`   | string | ❌        | `createdAt` |                                |
| `sortType` | string | ❌        | `desc`      | `asc` hoặc `desc`              |

> ⚠️ `page` bắt đầu từ **1** (khác với các API khác bắt đầu từ 0).

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get staff orders successfully",
  "result": {
    "content": [
      {
        "orderId": 100,
        "userId": 5,
        "fullName": "Nguyễn Văn A",
        "phoneNumber": "0912345678",
        "shippingAddress": "456 Đường XYZ, Hà Nội",
        "shippingFee": 30000.00,
        "totalPrice": 2430000.00,
        "status": "PENDING",
        "isPaid": false,
        "paymentMethod": "COD",
        "paymentDate": null,
        "createdAt": "2024-06-01T10:00:00",
        "modifiedAt": "2024-06-01T10:00:00",
        "createdBy": "customer01",
        "modifiedBy": "customer01"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 200,
    "totalPages": 20,
    "first": true,
    "last": false
  }
}
```

---

### 3.2 Lấy chi tiết đơn hàng

```
GET /management/{orderId}
```

| Param     | Type | Mô tả      |
|-----------|------|------------|
| `orderId` | Long | ID đơn hàng |

**Response 200:** _(cấu trúc giống `OrderDetailResponse` ở mục 2.4)_
```json
{
  "code": 1000,
  "message": "Get staff order detail successfully",
  "result": { ... }
}
```

---

### 3.3 Cập nhật trạng thái đơn hàng

```
PATCH /management/{orderId}/{status}
```

| Param     | Type   | Mô tả                                                              |
|-----------|--------|--------------------------------------------------------------------|
| `orderId` | Long   | ID đơn hàng                                                        |
| `status`  | string | Trạng thái mới: `CONFIRMED` / `SHIPPING` / `DELIVERED` / `CANCELLED` / `RETURNED` |

**Response 204:** No Content

---

## Luồng đặt hàng điển hình

```
1. Thêm vào giỏ       POST /cart-item/add
2. Xem giỏ hàng       GET  /cart-item/my-cart
3. Xem trước đơn      GET  /orders/preview      (gửi body danh sách item)
4. Đặt hàng           POST /orders/checkout
5. Xem đơn của tôi    GET  /orders/my-orders
6. Xem chi tiết đơn   GET  /orders/my-orders/{orderId}
```

---

## Lỗi phổ biến

| HTTP Status | Ý nghĩa                                        |
|-------------|------------------------------------------------|
| 400         | Dữ liệu request không hợp lệ (validation)      |
| 401         | Chưa xác thực (thiếu / sai token)              |
| 403         | Không có quyền truy cập                        |
| 404         | Không tìm thấy đơn hàng / cart item / variant  |
| 409         | Xung đột (VD: không đủ tồn kho)               |

**Ví dụ response lỗi:**
```json
{
  "code": 4001,
  "message": "Order not found"
}
```
