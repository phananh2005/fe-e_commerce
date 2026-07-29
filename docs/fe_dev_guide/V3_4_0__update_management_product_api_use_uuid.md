---
version: V3.4.0
date: 2026-07-29
summary: Update Management Product API to use UUID
breaking_change: true
---

# V3.4.0: Cập nhật API Quản trị Sản phẩm sử dụng UUID

## Danh sách API thay đổi
- `GET /management/product/{uuid}` (Lấy chi tiết sản phẩm)
- `GET /management/product/{uuid}/variants` (Lấy danh sách biến thể của sản phẩm)
- `GET /management/product/{uuid}/variants/summary` (Lấy danh sách summary biến thể của sản phẩm)
- `PUT /management/product/update` (Cập nhật sản phẩm)
- `PATCH /management/product/variant/{uuid}` (Cập nhật giá và số lượng tồn kho của biến thể)

## Chi tiết thay đổi

Các API dành cho quản trị sản phẩm đã được thay thế ID bằng UUID. Các ID gốc (Long) đã bị ẩn khỏi JSON response để bắt buộc sử dụng UUID. **Đây là một Breaking Change**.

1. **`GET /management/product/{uuid}`**:
   - Path variable thay đổi từ `id` (Long) sang `uuid` (String).
   - Response DTO (`ProductDetailResponseForManagement`): trường `id` (của Product) đã bị ẩn đi (không trả về). Sử dụng `uuid` thay thế.

2. **`GET /management/product/{uuid}/variants`**:
   - Path variable thay đổi từ `productId` (Long) sang `uuid` (String) đại diện cho Product UUID.
   - Response DTO (`ProductVariantResponseForManagement`):
     - Trường `id` (của Variant) bị ẩn đi, sử dụng `uuid` thay thế.
     - Trong object Image: `imageId` bị ẩn đi, sử dụng `imageUuid` thay thế.

3. **`GET /management/product/{uuid}/variants/summary`**:
   - Path variable thay đổi từ `productId` (Long) sang `uuid` (String) đại diện cho Product UUID.
   - Response DTO (`ProductVariantsSummaryResponseForManagement`):
     - Ẩn `productId`, thêm `productUuid` thay thế.
     - Trong object Variant: ẩn `variantId`, sử dụng `variantUuid` thay thế.

4. **`PUT /management/product/update`**:
   - Request DTO (`ProductUpdateRequest`):
     - `productId` (Long) đổi tên thành `productUuid` (String).
     - Trong danh sách các Variant đã tồn tại (`VariantUpdateRequest`):
       - `variantId` (Long) đổi tên thành `variantUuid` (String).
       - `variantDetailImageIdsToDelete` (List<Long>) đổi tên thành `variantDetailImageUuidsToDelete` (List<String>).

5. **`PATCH /management/product/variant/{uuid}`**:
   - Path variable thay đổi từ `variantId` (Long) sang `uuid` (String) đại diện cho Variant UUID.

## Hướng dẫn FE cập nhật
- Bất cứ khi nào gọi API lên backend, lấy `uuid` thay vì `id`.
- Sửa lại các request body khi cập nhật sản phẩm: sử dụng `productUuid`, `variantUuid`, và `variantDetailImageUuidsToDelete`.
- Cập nhật logic đọc dữ liệu response: không còn các trường `id` (Long) cũ, tất cả định danh đều lấy qua UUID.
