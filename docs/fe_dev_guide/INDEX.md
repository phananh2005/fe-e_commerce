# Documentation Versions

| Version | Date | Changed Files | Summary |
|---------|------|---------------|---------|
| V1.1.1 | 2026-07-21 | `GET /management/order/search` | Thêm bộ lọc `userId` để quản trị viên lọc đơn hàng theo khách hàng cụ thể |
| V1.1.0 | 2026-07-21 | `GET /orders/my-orders/{orderId}`, `GET /management/order/{orderId}` | Refactor OrderDetailResponse: group `fullName`, `phoneNumber`, `shippingAddress` vào `addressInfo` inner class |
| V1.0.9 | 2026-07-21 | `GET /management/order/{orderId}` | Tách hàm `getOrderDetailForManagement` không kiểm tra ownership cho quản trị viên |
| V1.0.8 | 2026-07-21 | `GET /orders/my-orders/{orderId}` | Thêm xác thực ownership: customer chỉ xem đơn hàng của chính mình, nếu không sẽ nhận 403 Forbidden |
| V1.0.6 | 2026-07-20 | `GET /management/users/info/{id}` | Thêm fields `email` và `createdAt` vào response |
| V1.0.5 | 2026-07-20 | `GET /management/users/info/{id}` | Thêm xác thực quyền dựa trên role: SUPER_ADMIN xem tất cả, STORE_ADMIN chỉ xem DELIVERY_STAFF/CUSTOMER |
| V1.0.4 | 2026-07-20 | `GET /management/order/search` | Thêm trường `status` và `updatedAt` vào response |
| V1.0.3 | 2026-07-19 | `GET /management/order/search` | Loại bỏ bộ lọc fullName, phoneNumber, shippingAddress, status; loại bỏ các trường response không cần; thêm danh sách sản phẩm trong response |
| V1.0.2 | 2026-07-19 | `GET /management/order/search` | Bổ sung lọc khoảng thời gian tạo đơn hàng: createdFromDate, createdToDate |
| V1.0.1 | 2026-07-19 | `GET /management/order/search` | Bổ sung bộ lọc danh sách đơn hàng: orderCode, fullName, phoneNumber, shippingAddress, status |
| v1.0.0 | 2026-07-19 | Initial | Initial release — full API reference for frontend integration |
