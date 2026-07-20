# V1.0.3 — Đơn giản hóa bộ lọc, thêm status filter, và thêm danh sách sản phẩm vào GET /management/order/search

- **Version:** V1.0.3
- **Ngày tạo:** 2026-07-19
- **Loại thay đổi:** Cập nhật API
- **Breaking change:** Có

## API thay đổi

### GET `/management/order/search`

API tiếp tục dùng `GET` và nhận toàn bộ điều kiện qua query parameters bằng `@ModelAttribute`.

#### Request thay đổi

Loại bỏ các trường lọc sau từ request:
- `fullName` (tìm gần đúng theo tên người nhận)
- `phoneNumber` (tìm gần đúng theo số điện thoại)
- `shippingAddress` (tìm gần đúng theo địa chỉ giao hàng)

Giữ lại trường `status` để lọc chính xác theo trạng thái đơn hàng.

Query parameters:

| Query parameter | Kiểu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `orderCode` | string | Không | Mã đơn hàng (ID); khớp chính xác. Giá trị không phải số không trả về kết quả. |
| `status` | `OrderStatus` | Không | Lọc chính xác: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`. |
| `createdFromDate` | ISO 8601 datetime | Không | Ngày giờ bắt đầu (>=). Định dạng: `2026-07-19T10:30:00` hoặc `2026-07-19T10:30:00.123` |
| `createdToDate` | ISO 8601 datetime | Không | Ngày giờ kết thúc (<=). Định dạng: `2026-07-19T23:59:59` hoặc `2026-07-19T23:59:59.999` |
| `page` | integer | Không | Trang, mặc định `0`; phải lớn hơn hoặc bằng `0`. |
| `size` | integer | Không | Số phần tử mỗi trang, mặc định `10`; phải lớn hơn hoặc bằng `1`. |
| `sortBy` | string | Không | Trường sắp xếp, mặc định `createdAt`. |
| `sortType` | string | Không | Hướng sắp xếp, mặc định `desc`. |

Ví dụ request mới:

```http
GET /management/order/search?orderCode=123&status=CONFIRMED&createdFromDate=2026-07-01T00:00:00&createdToDate=2026-07-31T23:59:59&page=0&size=10&sortBy=createdAt&sortType=desc
Authorization: Bearer <accessToken>
```

#### Response thay đổi

Loại bỏ các trường sau từ response:
- `fullName` (tên người nhận)
- `phoneNumber` (số điện thoại)
- `shippingAddress` (địa chỉ giao hàng)
- `shippingFee` (phí giao hàng)
- `status` (trạng thái đơn hàng)
- `isPaid` (trạng thái thanh toán)
- `paymentMethod` (phương thức thanh toán)
- `paymentDate` (ngày thanh toán)
- `modifiedAt` (ngày sửa đổi)
- `createdBy` (người tạo)
- `modifiedBy` (người sửa đổi)

Thêm trường mới `items` — danh sách sản phẩm trong đơn hàng:

| Trường | Kiểu | Mô tả |
|---|---|---|
| `items` | `Item[]` | Danh sách sản phẩm/biến thể trong đơn hàng. |
| `items[].productId` | long | ID sản phẩm. |
| `items[].productName` | string | Tên sản phẩm. |
| `items[].skuCode` | string | Mã SKU của biến thể. |
| `items[].quantity` | integer | Số lượng mua trong đơn hàng. |
| `items[].price` | decimal | Giá mua của sản phẩm (mỗi đơn vị). |
| `items[].variantImageUrl` | string | URL ảnh biến thể. |

Thêm trường `username`:

| Trường | Kiểu | Mô tả |
|---|---|---|
| `username` | string | Tên đăng nhập của người đặt hàng. |

#### API PATCH cập nhật trạng thái - thêm lý do hủy

API PATCH `/management/order/{orderId}` với OrderStatusUpdateRequest:

**Request:**
```json
{
  "status": "CANCELLED",
  "cancellationReason": "Thay đổi địa chỉ giao hàng"
}
```

**Query parameters được phép:**
| Query parameter | Kiểu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `orderCode` | string | Không | Mã đơn hàng (ID); khớp chính xác. Giá trị không phải số không trả về kết quả. |
| `status` | `OrderStatus` | Không | Lọc chính xác: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`. |
| `createdFromDate` | ISO 8601 datetime | Không | Ngày giờ bắt đầu (>=). Định dạng: `2026-07-19T10:30:00` hoặc `2026-07-19T10:30:00.123` |
| `createdToDate` | ISO 8601 datetime | Không | Ngày giờ kết thúc (<=). Định dạng: `2026-07-19T23:59:59` hoặc `2026-07-19T23:59:59.999` |
| `page` | integer | Không | Trang, mặc định `0`; phải lớn hơn hoặc bằng `0`. |
| `size` | integer | Không | Số phần tử mỗi trang, mặc định `10`; phải lớn hơn hoặc bằng `1`. |
| `sortBy` | string | Không | Trường sắp xếp, mặc định `createdAt`. |
| `sortType` | string | Không | Hướng sắp xếp, mặc định `desc`. |

**Rule:**
- `cancellationReason` BẮT BUỘC khi `status` là `CANCELLED` hoặc `RETURNED`.
- Khi `status` không phải CANCELLED/RETURNED, `cancellationReason` bị bỏ qua.

**Response object trả về:** Giống như GET `/management/order/search` (bao gồm `items`, `username`).

## Hướng dẫn cập nhật FE cho PATCH

1. **API call mới:**
   - Sử dụng API PATCH `/management/order/{orderId}` với body chứa `status` và `cancellationReason` (chỉ bắt buộc cho CANCELLED/RETURNED)
   - Phải nhập lý do đầy đủ ký tự (tối thiểu 1) khi chuyển đơn sang trạng thái hủy hoặc trả hàng

2. ** validation FE:**
   - Hiển thị field "Lý do hủy" trong UI update trạng thái
   - chỉ hiển thị field này khi status là CANCELLED hoặc RETURNED
   - Ngăn chặn submit nếu status là CANCELLED/RETURNED và cancellationReason trống

3. **Xử lý response:**
   - Khi thành công, refresh lại danh sách đơn hàng (GET `/management/order/search`)
   - Chỉ hiển thị cancellationReason trong order detail (`GET /management/order/{orderId}`)

## Ảnh hưởng FE và Backend

- **Backend:**
  - Thêm field `cancellationReason` vào bảng `orders`
  - Thêm validation yêu cầu lý do khi cập nhật trạng thái
  - Giữ nguyên tất cả API hiện tại, chỉ thêm mới PATCH với request body

- **FE:**
  - Thêm field "Lý do hủy" trong order management
  - Chỉ hiển thị cho đơn hàng đã hủy hoặc trả hàng
  - Thêm validation bắt buộc cho CANCELLED/RETURNED

## Ghi chú

- API detail (`GET /management/order/{orderId}`) vẫn giữ nguyên, chỉ hiển thị cancellationReason.
- GET `/management/order/search` vẫn như cũ.
- PATCH `/management/order/{orderId}` là API mới, thay thế PATCH cũ với PathVariable.

Status code: `200 OK`

## Hướng dẫn cập nhật FE

1. **Loại bỏ các input filter:**
   - Xóa input "Tên người nhận" (`fullName`)
   - Xóa input "Số điện thoại" (`phoneNumber`)
   - Xóa input "Địa chỉ giao hàng" (`shippingAddress`)
   - Giữ lại: "Mã đơn hàng", "Trạng thái", "Từ ngày", "Đến ngày", phân trang, sắp xếp

2. **Cập nhật danh sách đơn hàng:**
   - Loại bỏ cột/thông tin: Tên khách, SĐT, Địa chỉ, Phí giao, Thanh toán, Phương thức thanh toán
   - Thêm cột/mục "Sản phẩm" hiển thị danh sách với định dạng:
      ```
      - Tên sản phẩm (variantName) x Số lượng
        [Ảnh thumbnail]
      - Tên sản phẩm 2 (variantName2) x Số lượng 2
        [Ảnh thumbnail]
      ```
   - Hoặc dùng expandable row / popup để hiển thị chi tiết sản phẩm

3. **Cập nhật API call:**
   - Loại bỏ các tham số: `fullName`, `phoneNumber`, `shippingAddress`
   - Chỉ gửi: `orderCode`, `status`, `createdFromDate`, `createdToDate`, `page`, `size`, `sortBy`, `sortType`
   - Reset `page` về `0` khi thay đổi bất kỳ điều kiện lọc nào

4. **Xử lý response:**
   - Lấy dữ liệu từ trường `items` mà không cần call API riêng để lấy chi tiết sản phẩm
   - Render danh sách sản phẩm trực tiếp từ mảy `items`

## Ảnh hưởng FE

- Màn hình/module quản lý đơn hàng (Order Management).
- Breaking change: Request và response thay đổi; cần cập nhật service, component, template.
- Loại bỏ logic lọc theo khách hàng, số điện thoại, địa chỉ.
- Giữ lại logic lọc theo trạng thái đơn hàng.
- Thêm logic hiển thị danh sách sản phẩm trực tiếp từ response.

## Ghi chú

- API detail (`GET /management/order/{orderId}`) vẫn giữ toàn bộ thông tin cũ (fullName, phoneNumber, shippingAddress, status, v.v.) — không thay đổi.
- Chỉ thay đổi list/search endpoint; các endpoint khác vẫn hoạt động bình thường.
