# V2.2.3: Đồng bộ và sửa lỗi tài liệu API so với Backend thực tế

**Ngày tạo:** 2026-07-28

## Danh sách API thay đổi / đính chính
- Quản lý đơn hàng (Management Order)
- Giỏ hàng (Cart)
- Các API Quản trị (Management)
- Tìm kiếm sản phẩm (Product Search)

## Loại thay đổi
- Đính chính tài liệu (Documentation Correction) để khớp hoàn toàn với Backend hiện tại.

## Chi tiết đính chính (Các API bị sai trong tài liệu cũ)

### 1. API Cập nhật trạng thái đơn hàng (Management Order)
- **Tài liệu cũ ghi sai:** `PATCH /management/order/{orderId}/{status}` (ví dụ: `PATCH /management/order/1/CONFIRMED`)
- **Backend thực tế:** `PATCH /management/order/{orderId}`
- **Giải thích:** API yêu cầu truyền `status` và `cancellationReason` thông qua Request Body (JSON) thay vì Path Variable.
- **Request Body chuẩn:**
  ```json
  {
    "status": "CONFIRMED",
    "cancellationReason": null
  }
  ```
  *(Lưu ý: Bắt buộc truyền `cancellationReason` nếu status là `CANCELLED` hoặc `RETURNED`)*

### 2. API Xóa sản phẩm khỏi giỏ hàng (Cart Item)
- **Tài liệu cũ (phần tóm tắt) ghi sai:** `DELETE /cart-item/remove/{id}`
- **Backend thực tế:** `DELETE /cart-item/remove/{ids}`
- **Giải thích:** API hỗ trợ xóa nhiều item cùng lúc, truyền danh sách các ID ngăn cách bằng dấu phẩy (Ví dụ: `DELETE /cart-item/remove/1,2,3`).

### 3. API Tìm kiếm sản phẩm (Product Search)
- **Tài liệu cũ có lúc ghi nhầm:** `GET /product/search`
- **Backend thực tế có 2 API riêng biệt:**
  - Khách hàng (Customer): `GET /search`
  - Quản trị viên (Management): `GET /management/product/search`

### 4. Lưu ý về Base Path của các Controller Quản trị
- **Hiện trạng code BE:** Các controller quản trị (`ManagementUserController`, `ManagementBrandController`, `ManagementCategoryController`, `DashboardController`) đang khai báo `@RequestMapping` thiếu dấu `/` ở đầu (ví dụ `@RequestMapping("management/users")`).
- **Thực tế:** Spring Boot tự động thêm `/` vào đầu, nên URL thực tế FE gọi vẫn là `/management/users`, `/management/brands`, `/management/categories`, `/management/statistics`. FE không cần thay đổi gì, tiếp tục gọi với dấu `/` bình thường.

## Hướng dẫn FE cập nhật
1. **Cập nhật tính năng Đổi trạng thái đơn hàng:** Đổi từ việc gắn `status` vào URL sang gửi qua JSON body.
2. **Cập nhật tính năng Xóa giỏ hàng:** Đảm bảo truyền danh sách ID (hoặc 1 ID) vào tham số `{ids}`.
3. Rà soát lại các endpoints gọi API tìm kiếm sản phẩm cho đúng luồng Customer/Management.

## Breaking change
- **Có**: Nếu FE đang gọi API cập nhật trạng thái đơn hàng theo cách cũ (`/management/order/{orderId}/{status}`), API sẽ trả về lỗi `404 Not Found` hoặc `405 Method Not Allowed`. Cần sửa lại gọi đúng URL và truyền body.
