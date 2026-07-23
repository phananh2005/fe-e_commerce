# FE Development Guide Migration - V1_1_5

- **Version**: V1_1_5
- **Ngày tạo**: 2026-07-21
- **API thay đổi**: `GET /management/product/search`
- **Loại thay đổi**: Cập nhật contract request/response
- **Breaking change**: Có

## 1) Thay đổi Request

### Bỏ các query params sau
- `minPrice`
- `maxPrice`
- `minRating`

### Thêm các query params để lọc sản phẩm
- `productSearch` (String): lọc theo `id` nếu chuỗi là số hợp lệ, ngược lại lọc theo `name` (contains, không phân biệt hoa thường)

## 2) Thay đổi Response (`Page<ProductResponse>.content[]`)

### Bỏ các fields sau
- `description`
- `categoryName`
- `brandName`
- `createdAt`
- `createdBy`
- `modifiedBy`
- `keyword`

### Response hiện tại giữ lại
- `id`
- `avatarUrl`
- `name`
- `status`
- `modifiedAt`

## 3) Hướng dẫn cập nhật Frontend

1. Cập nhật form/filter tìm kiếm sản phẩm quản trị:
   - Xóa các input: `minPrice`, `maxPrice`, `minRating`.
   - Thêm input duy nhất `productSearch` (String).
2. Cập nhật mapping response của danh sách sản phẩm:
   - Ngừng đọc các field đã bị loại bỏ (`description`, `categoryName`, `brandName`, `createdAt`, `createdBy`, `modifiedBy`, `keyword`).
   - Chỉ dùng các field còn lại (`id`, `avatarUrl`, `name`, `status`, `modifiedAt`).
3. Rà soát các màn hình/bảng đang hiển thị dữ liệu cũ để tránh lỗi undefined.

## 4) Quy tắc xử lý backend cho `productSearch`

- Nếu `productSearch` là chuỗi số hợp lệ (`Long`): filter theo `id` sản phẩm.
- Nếu không phải số: filter theo `name` sản phẩm (contains, không phân biệt hoa thường).

## 5) Ảnh hưởng FE dự kiến

- Màn hình quản trị danh sách sản phẩm (search/filter/list table).
- Các module phụ thuộc dữ liệu chi tiết hiển thị trực tiếp từ API search này.
- Module query params/state filter đang map riêng `productId` và `productName`.
