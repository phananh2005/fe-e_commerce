# V1.0.1 — Bổ sung bộ lọc danh sách đơn hàng quản trị

- **Version:** V1.0.1
- **Ngày tạo:** 2026-07-19
- **Loại thay đổi:** Cập nhật API
- **Breaking change:** Không

## API thay đổi

### GET `/management/order/search`

API tiếp tục dùng `GET` và nhận toàn bộ điều kiện qua query parameters bằng `@ModelAttribute`.

| Query parameter | Kiểu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `orderCode` | string | Không | Mã đơn hàng (ID); khớp chính xác. Giá trị không phải số không trả về kết quả. |
| `fullName` | string | Không | Tìm gần đúng, không phân biệt hoa thường, theo tên người nhận. |
| `phoneNumber` | string | Không | Tìm gần đúng theo số điện thoại người nhận. |
| `shippingAddress` | string | Không | Tìm gần đúng, không phân biệt hoa thường, theo địa chỉ giao hàng. |
| `status` | `OrderStatus` | Không | Lọc chính xác: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`. |
| `page` | integer | Không | Trang, mặc định `0`; phải lớn hơn hoặc bằng `0`. |
| `size` | integer | Không | Số phần tử mỗi trang, mặc định `10`; phải lớn hơn hoặc bằng `1`. |
| `sortBy` | string | Không | Trường sắp xếp, mặc định `createdAt`. |
| `sortType` | string | Không | Hướng sắp xếp, mặc định `desc`. |

Ví dụ:

```http
GET /management/order/search?fullName=Nguyen&status=CONFIRMED&page=0&size=10&sortBy=createdAt&sortType=desc
Authorization: Bearer <accessToken>
```

Response không đổi: `200 OK` với `ApiResponse<Page<ManagementOrderResponse>>`.

## Hướng dẫn cập nhật FE

- Bổ sung các control filter mã đơn hàng, tên người nhận, số điện thoại, địa chỉ giao hàng và trạng thái vào màn hình quản lý đơn hàng.
- Chỉ gửi query parameter có giá trị; bỏ trống filter sẽ giữ hành vi lấy toàn bộ danh sách.
- Dùng các giá trị enum `OrderStatus` viết hoa cho filter trạng thái.
- Reset `page` về `0` khi thay đổi bất kỳ điều kiện lọc hoặc sắp xếp nào.

## Ảnh hưởng FE

- Màn hình/module quản lý đơn hàng.
- Không thay đổi cấu trúc response, route, method, authentication hoặc permission hiện tại.
