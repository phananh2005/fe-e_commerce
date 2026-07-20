# Documentation Versions

| Version | Date | Changed Files | Summary |
|---------|------|---------------|---------|
| V1.0.7 | 2026-07-21 | `GET /management/users` | Bỏ `modifiedDateFrom`, `modifiedDateTo`; thêm `userIdentifier` (lọc ID/username); keyword lọc theo fullName, email, phoneNumber |
| V1.0.6 | 2026-07-20 | `GET /management/users/info/{id}` | Thêm fields `email` và `createdAt` vào response |
| V1.0.5 | 2026-07-20 | `GET /management/users/info/{id}` | Thêm xác thực quyền dựa trên role: SUPER_ADMIN xem tất cả, STORE_ADMIN chỉ xem DELIVERY_STAFF/CUSTOMER |
| V1.0.4 | 2026-07-20 | `GET /management/order/search` | Thêm trường `status` và `updatedAt` vào response |
| V1.0.3 | 2026-07-19 | `GET /management/order/search` | Loại bỏ bộ lọc fullName, phoneNumber, shippingAddress, status; loại bỏ các trường response không cần; thêm danh sách sản phẩm trong response |
| V1.0.2 | 2026-07-19 | `GET /management/order/search` | Bổ sung lọc khoảng thời gian tạo đơn hàng: createdFromDate, createdToDate |
| V1.0.1 | 2026-07-19 | `GET /management/order/search` | Bổ sung bộ lọc danh sách đơn hàng: orderCode, fullName, phoneNumber, shippingAddress, status |
| v1.0.0 | 2026-07-19 | Initial | Initial release — full API reference for frontend integration |
