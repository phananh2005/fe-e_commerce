---
version: V3.5.0
date: 2026-07-29
summary: Xóa các trường ID cũ khỏi Management Order Response
breaking_change: true
---

# V3.5.0: Xóa các trường ID cũ khỏi API Management Order

## Danh sách API thay đổi
- `GET /management/order/search` (Lấy danh sách đơn hàng cho quản trị viên)

## Chi tiết thay đổi

Trong phiên bản API này, các ID mang tính chất nội bộ (kiểu `Long`) đã bị loại bỏ hoàn toàn khỏi JSON response nhằm bảo mật và bắt buộc FE chuyển sang sử dụng `UUID`. **Đây là một Breaking Change**.

Chi tiết thay đổi trong `ManagementOrderResponse`:
1. Trường `orderId` bị ẩn đi, sử dụng `orderUuid` thay thế.
2. Trường `userId` bị ẩn đi, sử dụng `userUuid` thay thế.
3. Trong danh sách `items` (chi tiết sản phẩm của đơn hàng): Trường `productId` bị ẩn đi, sử dụng `productUuid` thay thế.

*Lưu ý:* Các trường đã bị ẩn bằng `@JsonIgnore` và sẽ không còn xuất hiện trong chuỗi JSON trả về.

## Hướng dẫn FE cập nhật
- Kiểm tra các màn hình Danh sách đơn hàng quản trị, không đọc các trường `orderId`, `userId` nữa mà lấy dữ liệu thông qua `orderUuid` và `userUuid`.
- Không đọc `productId` trong danh sách `items`, lấy định danh sản phẩm qua `productUuid` để gọi các API lấy thông tin chi tiết hoặc liên kết khác nếu cần.
