# V1.0.2 — Bổ sung lọc khoảng thời gian tạo đơn hàng

- **Version:** V1.0.2
- **Ngày tạo:** 2026-07-19
- **Loại thay đổi:** Cập nhật API
- **Breaking change:** Không

## API thay đổi

### GET `/management/order/search`

API tiếp tục dùng `GET` và nhận toàn bộ điều kiện qua query parameters bằng `@ModelAttribute`.

Bổ sung 2 trường filter khoảng thời gian tạo đơn hàng:

| Query parameter | Kiểu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `orderCode` | string | Không | Mã đơn hàng (ID); khớp chính xác. Giá trị không phải số không trả về kết quả. |
| `fullName` | string | Không | Tìm gần đúng, không phân biệt hoa thường, theo tên người nhận. |
| `phoneNumber` | string | Không | Tìm gần đúng theo số điện thoại người nhận. |
| `shippingAddress` | string | Không | Tìm gần đúng, không phân biệt hoa thường, theo địa chỉ giao hàng. |
| `status` | `OrderStatus` | Không | Lọc chính xác: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`. |
| `createdFromDate` | ISO 8601 datetime | Không | Ngày giờ bắt đầu (>=). Định dạng: `2026-07-19T10:30:00` hoặc `2026-07-19T10:30:00.123` |
| `createdToDate` | ISO 8601 datetime | Không | Ngày giờ kết thúc (<=). Định dạng: `2026-07-19T23:59:59` hoặc `2026-07-19T23:59:59.999` |
| `page` | integer | Không | Trang, mặc định `0`; phải lớn hơn hoặc bằng `0`. |
| `size` | integer | Không | Số phần tử mỗi trang, mặc định `10`; phải lớn hơn hoặc bằng `1`. |
| `sortBy` | string | Không | Trường sắp xếp, mặc định `createdAt`. |
| `sortType` | string | Không | Hướng sắp xếp, mặc định `desc`. |

Ví dụ:

```http
GET /management/order/search?fullName=Nguyen&createdFromDate=2026-07-01T00:00:00&createdToDate=2026-07-31T23:59:59&status=CONFIRMED&page=0&size=10&sortBy=createdAt&sortType=desc
Authorization: Bearer <accessToken>
```

Response không đổi: `200 OK` với `ApiResponse<Page<ManagementOrderResponse>>`.

## Hướng dẫn cập nhật FE

- Bổ sung 2 input control "Từ ngày" (`createdFromDate`) và "Đến ngày" (`createdToDate`) vào màn hình quản lý đơn hàng.
- Cho phép người dùng chọn khoảng thời gian, hỗ trợ datetime picker hoặc date picker + time picker.
- Gửi định dạng ISO 8601 datetime: `YYYY-MM-DDTHH:mm:ss` (timezone local) hoặc có millisecond.
- Nếu chỉ chọn "từ ngày" mà không chọn "đến ngày" (và ngược lại), vẫn gửi được; server chỉ lọc theo điều kiện được cung cấp.
- Chỉ gửi query parameter có giá trị; bỏ trống filter sẽ không áp dụng điều kiện khoảng thời gian.
- Reset `page` về `0` khi thay đổi bất kỳ điều kiện lọc hoặc sắp xếp nào.

## Ảnh hưởng FE

- Màn hình/module quản lý đơn hàng.
- Không thay đổi cấu trúc response, route, method, authentication hoặc permission hiện tại.
