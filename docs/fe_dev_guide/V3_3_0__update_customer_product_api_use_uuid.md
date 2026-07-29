---
version: V3.3.0
date: 2026-07-29
summary: Update Customer Product API to use UUID
breaking_change: true
---

# V3.3.0: Cập nhật API Sản phẩm cho Khách hàng sử dụng UUID

## Danh sách API thay đổi
- `GET /search` (Tìm kiếm sản phẩm)
- `GET /product/{uuid}` (Lấy chi tiết sản phẩm)

## Chi tiết thay đổi

Các API dành cho khách hàng đã được thay thế ID bằng UUID. Các ID cũ bị ẩn khỏi JSON response để bắt buộc sử dụng UUID. **Đây là một Breaking Change**.

1. **`GET /search`**:
   - Request param đổi: Vẫn giữ nguyên sử dụng `categoryId` và `brandId` như cũ (vì hai thực thể này không có UUID).
   - Response DTO (`ProductSummaryResponse`): trường `productId` đã bị ẩn đi (không trả về). Sử dụng `productUuid` thay thế.

2. **`GET /product/{uuid}`**:
   - Path variable thay đổi từ `id` (Long) sang `uuid` (String).
   - Response DTO (`ProductDetailResponse`): các trường sau đã bị ẩn đi:
     - `productId`
     - Trong object Variant: `variantId`
     - Trong object Image: `imageId`
   - Dữ liệu trả về sẽ sử dụng các mã định danh tương ứng: `productUuid`, `variantUuid`, `imageUuid`, tên Category, tên Brand. `brandId` và `categoryId` vẫn được giữ nguyên.

## Hướng dẫn FE cập nhật
- Khi tìm kiếm sản phẩm: truyền tham số `categoryId` và `brandId` lên server như cũ.
- Danh sách kết quả trả về: lấy `productUuid` để link sang trang chi tiết.
- Trang chi tiết sản phẩm: lấy `uuid` từ URL để gọi api `/product/{uuid}`.
- Cập nhật luồng logic đọc dữ liệu từ `ProductDetailResponse`: bỏ `productId`, `variantId`, v.v... sử dụng các thuộc tính UUID thay thế.
