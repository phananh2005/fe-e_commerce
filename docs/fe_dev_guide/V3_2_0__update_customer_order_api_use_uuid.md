---
version: V3.2.0
date: 2026-07-29
summary: Update Customer Order API to use UUID
breaking_change: true
---

# V3.2.0: Cập nhật API Đơn hàng của Khách hàng sử dụng UUID

## Danh sách API thay đổi
- `POST /orders/preview` (Xem trước đơn hàng)
- `POST /orders/checkout` (Thanh toán đơn hàng)
- `GET /orders/my-orders` (Lấy danh sách đơn hàng của tôi)
- `GET /orders/my-orders/{orderUuid}` (Lấy chi tiết đơn hàng)

## Chi tiết thay đổi

Các API dành cho khách hàng đã được thay thế ID bằng UUID. Các ID cũ bị ẩn khỏi JSON response để buộc FE sử dụng UUID. **Đây là một Breaking Change**.

1. **`POST /orders/preview`**:
   - Payload request đổi `variantId` (Long) thành `variantUuid` (String).

2. **`POST /orders/checkout`**:
   - Payload request cho từng item đổi `variantId` (Long) thành `variantUuid` (String).

3. **`GET /orders/my-orders`**:
   - Trường `id` trong dữ liệu trả về (`OrderSummaryResponse`) đã bị loại bỏ/ẩn đi.
   - Frontend bắt buộc phải dùng `orderUuid` để định danh đơn hàng.

4. **`GET /orders/my-orders/{orderUuid}`**:
   - Path variable thay đổi từ `orderId` (Long) sang `orderUuid` (String).
   - Trong dữ liệu trả về (`OrderDetailResponse`), các trường `orderId`, `userId`, và `productId` (trong mảng items) đã bị ẩn đi.
   - Sử dụng `orderUuid`, `userUuid`, và `productUuid` thay thế.

## Hướng dẫn FE cập nhật
- Khi gọi `preview` và `checkout`, sửa lại payload gửi lên server, truyền `variantUuid` thay cho `variantId`.
- Trong danh sách đơn hàng của tôi, sử dụng `orderUuid` làm key hoặc param để chuyển trang chi tiết.
- Cập nhật hàm lấy chi tiết đơn hàng truyền tham số `orderUuid` kiểu String trên URL.
- Xóa bỏ việc truy cập vào `id`, `orderId`, `userId`, `productId` vì các trường này không còn trả về nữa. Mọi định danh sử dụng UUID tương ứng.
